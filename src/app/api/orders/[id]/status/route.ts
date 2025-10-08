import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        paymentStatus: true,
        orderStatus: true,
        mpesaReceipt: true,
        checkoutRequestId: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      mpesaReceipt: order.mpesaReceipt,
      checkoutRequestId: order.checkoutRequestId,
      lastUpdated: order.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}