import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  ShoppingBag, 
  Truck, 
  MapPin,
  Phone,
  CreditCard,
  Receipt
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusChecker } from "@/components/order/payment-status-checker";
import { stackServerApp } from "@/lib/stack";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_ICONS = {
  DRAFT: Clock,
  PENDING_PAYMENT: Clock,
  PROCESSING: Package,
  SHOPPING: ShoppingBag,
  OUT_FOR_DELIVERY: Truck,
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

const STATUS_DESCRIPTIONS = {
  DRAFT: "Order is being prepared",
  PENDING_PAYMENT: "Waiting for payment confirmation",
  PROCESSING: "Your order is being reviewed",
  SHOPPING: "Our shopper is getting your items",
  OUT_FOR_DELIVERY: "On the way to your location",
  DELIVERED: "Order completed successfully",
  CANCELLED: "Order was cancelled",
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id.slice(-8).toUpperCase()} | Shop4Me`,
  };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  // Check authentication - but don't require it for order viewing
  const user = await stackServerApp.getUser();

  // Fetch order with full details
  // For now, we allow viewing any order by ID (guest checkout support)
  // In production, you might want to add phone number verification or similar
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      statusLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
      expenses: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          enteredBy: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const StatusIcon = STATUS_ICONS[order.orderStatus as keyof typeof STATUS_ICONS] || Clock;
  const totalAmount = order.totalEstimate?.toNumber() || 0;
  const serviceFee = order.serviceFee?.toNumber() || 0;
  const deliveryFee = order.deliveryFeeEstimated?.toNumber() || order.deliveryFeeActual?.toNumber() || 0;
  const itemsSubtotal = order.items.reduce((sum, item) => {
    const estimate = item.estimatedPrice?.toNumber() || (item.unitPrice.toNumber() * item.quantity);
    return sum + estimate;
  }, 0);

  // Create status timeline
  const statusTimeline = [
    {
      status: "PENDING_PAYMENT",
      label: "Order Placed",
      completed: true,
      date: order.createdAt,
    },
    {
      status: "PROCESSING",
      label: "Payment Confirmed",
      completed: order.paymentStatus === "PAID",
      date: order.statusLogs.find(log => log.status === "PROCESSING")?.createdAt,
    },
    {
      status: "SHOPPING",
      label: "Shopping in Progress",
      completed: ["SHOPPING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus),
      date: order.statusLogs.find(log => log.status === "SHOPPING")?.createdAt,
    },
    {
      status: "OUT_FOR_DELIVERY",
      label: "Out for Delivery",
      completed: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus),
      date: order.statusLogs.find(log => log.status === "OUT_FOR_DELIVERY")?.createdAt,
    },
    {
      status: "DELIVERED",
      label: "Delivered",
      completed: order.orderStatus === "DELIVERED",
      date: order.statusLogs.find(log => log.status === "DELIVERED")?.createdAt,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={user ? "/orders" : "/"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {user ? "Back to orders" : "Back to home"}
          </Link>
        </Button>
        
        {/* Guest user notice */}
        {!user && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Viewing as guest:</strong> You can track your order here without signing in. 
              <Link href="/auth/signup" className="ml-1 underline hover:no-underline">
                Create an account
              </Link> to manage all your orders in one place.
            </p>
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge 
            variant={STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || "secondary"}
            className="px-3 py-1"
          >
            <StatusIcon className="mr-2 h-4 w-4" />
            {formatStatus(order.orderStatus)}
          </Badge>
        </div>
      </div>

      {/* Payment Status Checker - Shows real-time payment updates */}
      <PaymentStatusChecker
        orderId={order.id}
        initialPaymentStatus={order.paymentStatus}
        initialOrderStatus={order.orderStatus}
        checkoutRequestId={order.checkoutRequestId}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>
                {STATUS_DESCRIPTIONS[order.orderStatus as keyof typeof STATUS_DESCRIPTIONS] || 
                 "Track your order progress"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusTimeline.map((step, index) => {
                  const StepIcon = STATUS_ICONS[step.status as keyof typeof STATUS_ICONS] || Clock;
                  const isLast = index === statusTimeline.length - 1;
                  const isCancelled = order.orderStatus === "CANCELLED";
                  
                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            step.completed && !isCancelled
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-background text-muted-foreground"
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>
                        {!isLast && (
                          <div
                            className={`mt-2 h-8 w-0.5 ${
                              step.completed && !isCancelled ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${step.completed && !isCancelled ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(step.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show cancellation if applicable */}
                {order.orderStatus === "CANCELLED" && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-600">Order Cancelled</p>
                      {order.cancellationReason && (
                        <p className="text-sm text-muted-foreground">{order.cancellationReason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const unitPrice = item.unitPrice.toNumber();
                  const estimatedPrice = item.estimatedPrice?.toNumber() || (unitPrice * item.quantity);
                  
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {item.nameOverride || item.product?.name || "Custom item"}
                        </h3>
                        {item.product?.unit && (
                          <p className="text-sm text-muted-foreground">{item.product.unit}</p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">×{item.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(estimatedPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          {order.statusLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.statusLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-muted-foreground/50" />
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">{formatStatus(log.status)}</span>
                          {log.note && (
                            <span className="text-muted-foreground"> — {log.note}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)} • {formatStatus(log.actor)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge variant="secondary" className="text-xs">
                  {formatStatus(order.paymentStatus)}
                </Badge>
              </div>
              {order.mpesaReceipt && (
                <div className="flex justify-between text-sm">
                  <span>M-Pesa Receipt</span>
                  <span className="font-mono text-xs">{order.mpesaReceipt}</span>
                </div>
              )}
              {order.amountCollected && (
                <div className="flex justify-between text-sm">
                  <span>Amount Paid</span>
                  <span className="font-semibold">{formatCurrency(order.amountCollected.toNumber())}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Items subtotal</span>
                <span>{formatCurrency(itemsSubtotal)}</span>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Service fee</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.customerName && (
                <div>
                  <span className="font-medium">Customer:</span> {order.customerName}
                </div>
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.customerPhone}
                </div>
              )}
              {order.contactName && order.contactPhone && (
                <div>
                  <span className="font-medium">Contact:</span> {order.contactName} ({order.contactPhone})
                </div>
              )}
              {order.landmark && (
                <div>
                  <span className="font-medium">Location:</span> {order.landmark}
                </div>
              )}
              {order.plusCode && (
                <div>
                  <span className="font-medium">Plus Code:</span> {order.plusCode}
                </div>
              )}
              {order.deliveryNotes && (
                <div>
                  <span className="font-medium">Notes:</span> {order.deliveryNotes}
                </div>
              )}
              {order.preferredDeliverySlot && (
                <div>
                  <span className="font-medium">Preferred time:</span> {order.preferredDeliverySlot}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
