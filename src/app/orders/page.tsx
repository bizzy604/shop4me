import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { stackServerApp } from "@/lib/stack";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "My Orders | Shop4Me",
};

const STATUS_ICONS = {
  DRAFT: Clock,
  PENDING_PAYMENT: Clock,
  PROCESSING: Package,
  SHOPPING: ShoppingBag,
  OUT_FOR_DELIVERY: Package,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
} as const;

const STATUS_COLORS = {
  DRAFT: "secondary",
  PENDING_PAYMENT: "secondary",
  PROCESSING: "default",
  SHOPPING: "default",
  OUT_FOR_DELIVERY: "default",
  DELIVERED: "secondary",
  CANCELLED: "outline",
} as const;

const PAYMENT_STATUS_COLORS = {
  PENDING: "secondary",
  PAID: "secondary",
  FAILED: "outline",
  REFUNDED: "secondary",
  PARTIAL: "secondary",
} as const;

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function OrdersPage() {
  // Check authentication
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect("/auth/signin?redirect=" + encodeURIComponent("/orders"));
  }

  // Fetch user's orders
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: user.id },
        { customerPhone: user.primaryEmail }, // Fallback for orders before user registration
      ],
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (orders.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-3xl font-semibold">No orders yet</h1>
          <p className="mt-2 text-muted-foreground">
            When you place your first order, it will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
        <p className="mt-2 text-muted-foreground">
          Track your orders and view delivery status
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const StatusIcon = STATUS_ICONS[order.orderStatus as keyof typeof STATUS_ICONS] || Clock;
          const itemCount = order._count.items;
          const totalAmount = order.totalEstimate?.toNumber() || 0;
          
          return (
            <Card key={order.id} className="transition-colors hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <Badge 
                        variant={STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || "secondary"}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {formatStatus(order.orderStatus)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Placed on {formatDate(order.createdAt)}
                      {order.customerName && ` • ${order.customerName}`}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(totalAmount)}</div>
                    <Badge 
                      variant={PAYMENT_STATUS_COLORS[order.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || "secondary"}
                      className="text-xs"
                    >
                      {formatStatus(order.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                    {order.mpesaReceipt && (
                      <span>Receipt: {order.mpesaReceipt}</span>
                    )}
                    {order.deliveryFeeEstimated && (
                      <span>Delivery: {formatCurrency(order.deliveryFeeEstimated.toNumber())}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>
                      View details
                    </Link>
                  </Button>
                </div>
                
                {/* Quick preview of items */}
                {order.items.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="truncate">
                      {order.items
                        .slice(0, 3)
                        .map((item) => `${item.nameOverride || item.product?.name || "Item"} (${item.quantity})`)
                        .join(", ")}
                      {order.items.length > 3 && ` +${order.items.length - 3} more`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </main>
  );
}
