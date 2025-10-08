'use server';

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin, getCurrentUser } from "@/lib/user-persistence";
import prisma from "@/lib/prisma";
import { OrderStatus, StatusActor, StatusChannel } from "@/generated/prisma";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateOrderStatus(formData: FormData): Promise<AdminActionResult> {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized: Admin access required" };
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!orderId || !status) {
    return { ok: false, error: "Order ID and status are required" };
  }

  // Validate status
  const validStatuses = ["DRAFT", "PENDING_PAYMENT", "PROCESSING", "SHOPPING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { ok: false, error: "Invalid order status" };
  }

  try {
    const currentUser = await getCurrentUser();
    
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: status as OrderStatus,
      },
    });

    // Create status log entry
    await prisma.statusLog.create({
      data: {
        orderId,
        status: status as OrderStatus,
        actor: StatusActor.ADMIN,
        actorUserId: currentUser?.id,
        channel: StatusChannel.ADMIN_PORTAL,
        note: note || undefined,
      },
    });

    // Revalidate the page to show updated data
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { ok: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { ok: false, error: "Failed to update order status. Please try again." };
  }
}

export async function addOrderExpense(formData: FormData): Promise<AdminActionResult> {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized: Admin access required" };
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const costString = String(formData.get("cost") ?? "").trim();
  const deliveryFeeString = String(formData.get("deliveryFee") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim();

  if (!orderId) {
    return { ok: false, error: "Order ID is required" };
  }

  const cost = parseFloat(costString) || 0;
  const deliveryFee = deliveryFeeString ? parseFloat(deliveryFeeString) : null;

  if (cost <= 0 && (!deliveryFee || deliveryFee <= 0)) {
    return { ok: false, error: "At least one expense amount must be greater than 0" };
  }

  try {
    const currentUser = await getCurrentUser();
    
    // Add expense record
    await prisma.expense.create({
      data: {
        orderId,
        cost,
        deliveryFee,
        note: note || undefined,
        evidenceUrl: evidenceUrl || undefined,
        enteredById: currentUser?.id,
      },
    });

    // Update order's actual delivery fee if provided
    if (deliveryFee !== null) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryFeeActual: deliveryFee,
        },
      });
    }

    // Revalidate the page to show updated data
    revalidatePath(`/admin/orders/${orderId}`);

    return { ok: true };
  } catch (error) {
    console.error("Failed to add expense:", error);
    return { ok: false, error: "Failed to add expense. Please try again." };
  }
}