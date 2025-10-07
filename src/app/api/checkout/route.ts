import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, phone, amount } = body;

    // Validate required fields
    if (!orderId || !phone || !amount) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: orderId, phone, amount" },
        { status: 400 }
      );
    }

    // Verify order exists and is in correct state
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { ok: false, error: "Order has already been paid" },
        { status: 400 }
      );
    }

    if (order.orderStatus === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: "Order has been cancelled" },
        { status: 400 }
      );
    }

    // Check if STK Push is already in progress
    if (order.checkoutRequestId && order.paymentStatus === 'PENDING') {
      const timeSinceLastAttempt = Date.now() - order.updatedAt.getTime();
      if (timeSinceLastAttempt < 5 * 60 * 1000) { // 5 minutes
        return NextResponse.json({
          ok: false,
          error: "Payment is already in progress. Please wait a few minutes before trying again.",
        }, { status: 429 });
      }
    }

    // Initiate STK Push
    const stkResult = await initiateStkPush({
      orderId: order.id,
      phone: phone,
      amount: Number(amount),
      accountReference: `SHOP4ME-${order.id}`,
      transactionDesc: `Shop4Me Order ${order.id}`,
    });

    if (stkResult.success) {
      return NextResponse.json({
        ok: true,
        message: "STK Push initiated successfully",
        data: {
          merchantRequestId: stkResult.merchantRequestId,
          checkoutRequestId: stkResult.checkoutRequestId,
          customerMessage: stkResult.customerMessage,
        },
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: stkResult.errorMessage || "Failed to initiate payment",
        errorCode: stkResult.errorCode,
      }, { status: 400 });
    }
  } catch (e: unknown) {
    const error = e as Error;
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
