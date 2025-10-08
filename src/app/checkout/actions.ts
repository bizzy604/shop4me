'use server';

import prisma from "@/lib/prisma";
import { stackServerApp } from "@/lib/stack";
import { syncUserToDatabase } from "@/lib/user-sync";

export type CheckoutActionResult =
  | { ok: true; orderId: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

type IncomingCartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string | null;
};

type IncomingCartPayload = {
  items: IncomingCartItem[];
  serviceFee: number;
  subtotal: number;
  total: number;
};

function parseNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+]/g, "").replace(/^0/, "+254");
}

export async function createOrderDraft(formData: FormData): Promise<CheckoutActionResult> {
  const fieldErrors: Record<string, string> = {};

  const customerName = String(formData.get("customerName") ?? "").trim();
  if (!customerName) {
    fieldErrors.customerName = "Name is required";
  }

  const rawCustomerPhone = String(formData.get("customerPhone") ?? "").trim();
  if (!rawCustomerPhone) {
    fieldErrors.customerPhone = "Phone number is required";
  }
  const customerPhone = rawCustomerPhone ? sanitizePhone(rawCustomerPhone) : "";

  const contactName = String(formData.get("contactName") ?? "").trim();
  const rawContactPhone = String(formData.get("contactPhone") ?? "").trim();
  const contactPhone = rawContactPhone ? sanitizePhone(rawContactPhone) : "";

  const landmark = String(formData.get("landmark") ?? "").trim();
  const plusCode = String(formData.get("plusCode") ?? "").trim();
  const deliveryNotes = String(formData.get("deliveryNotes") ?? "").trim();
  const preferredDeliverySlot = String(formData.get("preferredDeliverySlot") ?? "").trim();

  const latitude = parseNumber(formData.get("latitude"));
  const longitude = parseNumber(formData.get("longitude"));
  const deliveryFeeEstimated = parseNumber(formData.get("deliveryFeeEstimated"));

  const cartRaw = formData.get("cart");
  if (typeof cartRaw !== "string" || !cartRaw) {
    return { ok: false, formError: "We couldn't read your cart. Please try again." };
  }

  let cart: IncomingCartPayload;
  try {
    cart = JSON.parse(cartRaw) as IncomingCartPayload;
  } catch (error) {
    console.error("Failed to parse cart payload", error);
    return { ok: false, formError: "Cart data was corrupted. Please rebuild your cart." };
  }

  if (!Array.isArray(cart.items) || cart.items.length === 0) {
    return { ok: false, formError: "Add at least one item to your cart before checkout." };
  }

  const serviceFee = Number(cart.serviceFee ?? 0);
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalEstimate = subtotal + serviceFee;

  if (Math.abs(totalEstimate - Number(cart.total ?? totalEstimate)) > 5) {
    fieldErrors.cart = "Cart total mismatch. Refresh and try again.";
  }

  for (const item of cart.items) {
    if (!item.name || !Number.isFinite(item.price) || !Number.isFinite(item.quantity)) {
      fieldErrors.cart = "Invalid item detected. Remove and add it again.";
      break;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  // Authentication is required for checkout
  // Get authenticated user and ensure they exist in the database
  let userId: string;
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    
    // Sync user to database to ensure they exist
    const syncResult = await syncUserToDatabase(user);
    
    if (!syncResult.success) {
      console.error("Failed to sync user during checkout:", syncResult.error);
      return {
        ok: false,
        formError: "Unable to verify your account. Please try signing out and signing back in.",
      };
    }
    
    userId = syncResult.userId;
  } catch (error) {
    console.error("Authentication required for checkout", error);
    return {
      ok: false,
      formError: "You must be signed in to place an order. Please sign in and try again.",
    };
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId, // Link order to authenticated user (guaranteed to exist in DB)
        customerName,
        customerPhone,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        landmark: landmark || null,
        plusCode: plusCode || null,
        deliveryNotes: deliveryNotes || null,
        preferredDeliverySlot: preferredDeliverySlot || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        serviceFee,
        deliveryFeeEstimated: deliveryFeeEstimated ?? null,
        totalEstimate,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId || null,
            nameOverride: item.name,
            quantity: Math.max(1, Math.round(item.quantity)),
            unitPrice: item.price,
            estimatedPrice: item.price * item.quantity,
          })),
        },
      },
    });

    return { ok: true, orderId: order.id };
  } catch (error) {
    console.error("Failed to create order draft", error);
    return { ok: false, formError: "Something went wrong while saving your order. Please try again." };
  }
}

export type PaymentActionResult =
  | { ok: true; checkoutRequestId: string; customerMessage?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

export async function initiatePayment(formData: FormData): Promise<PaymentActionResult> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!orderId) {
    return { ok: false, formError: "Order ID is required" };
  }

  if (!phone) {
    return { ok: false, fieldErrors: { phone: "Phone number is required" } };
  }

  try {
    // Fetch order to get total amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { ok: false, formError: "Order not found" };
    }

    if (!order.totalEstimate) {
      return { ok: false, formError: "Order total is not available" };
    }

    if (order.paymentStatus === 'PAID') {
      return { ok: false, formError: "Order has already been paid" };
    }

    if (order.orderStatus === 'CANCELLED') {
      return { ok: false, formError: "Order has been cancelled" };
    }

    // Check if STK Push is already in progress
    if (order.checkoutRequestId && order.paymentStatus === 'PENDING') {
      const timeSinceLastAttempt = Date.now() - order.updatedAt.getTime();
      if (timeSinceLastAttempt < 5 * 60 * 1000) { // 5 minutes
        return {
          ok: false,
          formError: "Payment is already in progress. Please wait a few minutes before trying again.",
        };
      }
    }

    // Import M-Pesa client dynamically to avoid issues with client-side bundling
    const { initiateStkPush } = await import("@/lib/mpesa");

    const stkResult = await initiateStkPush({
      orderId: order.id,
      phone: sanitizePhone(phone),
      amount: Number(order.totalEstimate),
      accountReference: `SHOP4ME-${order.id}`,
      transactionDesc: `Shop4Me Order ${order.id}`,
    });

    if (stkResult.success) {
      return {
        ok: true,
        checkoutRequestId: stkResult.checkoutRequestId!,
        customerMessage: stkResult.customerMessage,
      };
    } else {
      return {
        ok: false,
        formError: stkResult.errorMessage || "Failed to initiate payment",
      };
    }
  } catch (error) {
    console.error("Failed to initiate payment", error);
    return { ok: false, formError: "Something went wrong while initiating payment. Please try again." };
  }
}
