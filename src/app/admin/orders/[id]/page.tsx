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
  Receipt,
  DollarSign,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { ExpenseTracker } from "@/components/admin/expense-tracker";

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
    title: `Manage Order #${id.slice(-8).toUpperCase()} | Admin | Shop4Me`,
  };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent(`/admin/orders/${id}`));
  }

  // Fetch order with full details
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
        include: {
          actorUser: true,
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

  // Calculate total expenses
  const totalExpenses = order.expenses.reduce((sum, expense) => {
    return sum + expense.cost.toNumber() + (expense.deliveryFee?.toNumber() || 0);
  }, 0);

  const profit = (order.amountCollected?.toNumber() || 0) - totalExpenses;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || "secondary"}
              className="px-3 py-1"
            >
              <StatusIcon className="mr-2 h-4 w-4" />
              {formatStatus(order.orderStatus)}
            </Badge>
            <Badge variant="outline">
              {formatStatus(order.paymentStatus)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Order Status Management */}
          <OrderStatusUpdater order={order} />

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
                        <p className="text-xs text-muted-foreground">
                          Unit price: {formatCurrency(unitPrice)}
                        </p>
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

          {/* Expenses Tracking */}
          <ExpenseTracker 
            order={{
              id: order.id,
              expenses: order.expenses.map((expense) => ({
                id: expense.id,
                cost: expense.cost.toNumber(),
                deliveryFee: expense.deliveryFee?.toNumber() ?? null,
                note: expense.note,
                evidenceUrl: expense.evidenceUrl,
                createdAt: expense.createdAt,
                enteredBy: expense.enteredBy,
              })),
            }}
          />

          {/* Activity Log */}
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
                        {log.actorUser && ` (${log.actorUser.name || log.actorUser.email})`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Customer Total</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              {order.amountCollected && (
                <div className="flex justify-between text-sm">
                  <span>Amount Collected</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(order.amountCollected.toNumber())}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Total Expenses</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Profit/Loss</span>
                <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                  {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
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
              {order.merchantRequestId && (
                <div className="flex justify-between text-sm">
                  <span>Merchant Request</span>
                  <span className="font-mono text-xs">{order.merchantRequestId}</span>
                </div>
              )}
              {order.checkoutRequestId && (
                <div className="flex justify-between text-sm">
                  <span>Checkout Request</span>
                  <span className="font-mono text-xs">{order.checkoutRequestId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Breakdown
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

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Customer Details
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
                  <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.contactName && order.contactPhone && (
                <div>
                  <span className="font-medium">Contact:</span> {order.contactName} 
                  <a href={`tel:${order.contactPhone}`} className="ml-2 text-primary hover:underline">
                    ({order.contactPhone})
                  </a>
                </div>
              )}
              {order.landmark && (
                <div>
                  <span className="font-medium">Location:</span> {order.landmark}
                </div>
              )}
              {order.plusCode && (
                <div>
                  <span className="font-medium">Plus Code:</span> 
                  <a 
                    href={`https://plus.codes/${order.plusCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline"
                  >
                    {order.plusCode}
                  </a>
                </div>
              )}
              {order.latitude && order.longitude && (
                <div>
                  <span className="font-medium">GPS:</span>
                  <a 
                    href={`https://maps.google.com?q=${order.latitude},${order.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline"
                  >
                    {order.latitude.toNumber()}, {order.longitude.toNumber()}
                  </a>
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