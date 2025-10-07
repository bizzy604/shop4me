import Link from "next/link";
import { CheckCircle, Clock, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentInitiator } from "@/components/checkout/payment-initiator";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

const STATUS_COPY: Record<string, string> = {
  PENDING_PAYMENT: "We are preparing your payment request.",
  PROCESSING: "Our shopper is reviewing your list.",
  SHOPPING: "Your order is being shopped right now.",
  OUT_FOR_DELIVERY: "Driver is on the way to your location.",
  DELIVERED: "Delivered — thank you!",
  CANCELLED: "This order has been cancelled.",
  DRAFT: "Draft order awaiting confirmation.",
};

type ConfirmationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function sumItemEstimate(estimated: number | null, unitPrice: number, quantity: number) {
  if (typeof estimated === "number" && Number.isFinite(estimated)) {
    return estimated;
  }
  return unitPrice * quantity;
}

/**
 * Confirmation hub shown directly after checkout form submission. It pulls the freshly created
 * order draft from Prisma, summarises the next steps for payment, and points customers to detailed
 * tracking so they can follow progress without refreshing the cart or checkout screens again.
 */
export default async function CheckoutConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderId = resolveParam(params.orderId);

  if (!orderId) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Order submitted</CardTitle>
            <CardDescription>We saved your request but couldn&apos;t detect its reference. Check your SMS for the order ID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>If you just placed an order, refresh this page with the confirmation link or visit your orders dashboard.</p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/orders">Go to my orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>We couldn&apos;t find that order</CardTitle>
            <CardDescription>Please make sure you opened the latest confirmation link or contact support for help.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Reference provided: <span className="font-semibold">{orderId}</span></p>
            <p>If this keeps happening, ping us on WhatsApp and we&apos;ll track it down.</p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer">
                Message support
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const serviceFee = order.serviceFee?.toNumber() ?? 0;
  const deliveryEstimate = order.deliveryFeeEstimated?.toNumber() ?? null;
  const itemsSubtotal = order.items.reduce((sum, item) => {
    const estimate = item.estimatedPrice?.toNumber() ?? null;
    const perUnit = item.unitPrice.toNumber();
    return sum + sumItemEstimate(estimate, perUnit, item.quantity);
  }, 0);
  const totalEstimate = order.totalEstimate?.toNumber() ?? itemsSubtotal + serviceFee + (deliveryEstimate ?? 0);
  const paymentStatusLabel = formatStatus(order.paymentStatus);
  const orderStatusLabel = formatStatus(order.orderStatus);
  const statusCopy = STATUS_COPY[order.orderStatus] ?? "We&apos;ll keep you posted with real-time updates.";

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-emerald-900 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em]">
              <CheckCircle className="h-5 w-5" aria-hidden />
              Order confirmed
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">We received your request</h1>
            <p className="max-w-2xl text-sm text-emerald-900/80">We&apos;ll review availability, trigger the M-Pesa prompt, and update you on WhatsApp.</p>
          </div>
          <Badge variant="outline" className="border-emerald-500 text-emerald-900">Ref: {order.id}</Badge>
        </div>
      </section>

      <div className="space-y-8">
        <PaymentInitiator
          orderId={order.id}
          totalAmount={totalEstimate}
          customerPhone={order.customerPhone}
          paymentStatus={order.paymentStatus}
          orderStatus={order.orderStatus}
        />

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <Card className="h-full border-muted-foreground/30 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ReceiptText className="h-5 w-5 text-primary" aria-hidden />
                Order summary
              </CardTitle>
              <CardDescription>{statusCopy}</CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment status</span>
                <Badge variant="secondary">{paymentStatusLabel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order status</span>
                <Badge variant="outline">{orderStatusLabel}</Badge>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Items subtotal</span>
                <span className="font-semibold">{formatCurrency(itemsSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Service fee</span>
                <span className="font-semibold">{formatCurrency(serviceFee)}</span>
              </div>
              {deliveryEstimate !== null ? (
                <div className="flex items-center justify-between">
                  <span>Delivery estimate</span>
                  <span className="font-semibold">{formatCurrency(deliveryEstimate)}</span>
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Estimated total</span>
                <span>{formatCurrency(totalEstimate)}</span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What you ordered</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {order.items.map((item) => {
                  const unitPrice = item.unitPrice.toNumber();
                  const estimated = item.estimatedPrice?.toNumber() ?? unitPrice * item.quantity;
                  return (
                    <li key={item.id} className="flex items-start justify-between gap-4 rounded-lg border border-muted/40 p-3">
                      <div>
                        <p className="font-medium leading-tight">{item.nameOverride ?? item.product?.name ?? "Custom item"}</p>
                        {item.notes ? <p className="text-xs text-muted-foreground">{item.notes}</p> : null}
                        {item.product?.unit ? <p className="text-xs text-muted-foreground">{item.product.unit}</p> : null}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">x{item.quantity}</p>
                        <p>{formatCurrency(estimated)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-muted-foreground/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" aria-hidden />
              What happens next
            </CardTitle>
            <CardDescription>We&apos;ll nudge you via SMS or WhatsApp when action is required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="space-y-3">
              <li>
                <span className="font-medium text-foreground">1. Stock confirmation:</span> Shopper verifies prices and availability.
              </li>
              <li>
                <span className="font-medium text-foreground">2. M-Pesa STK push:</span> Approve the prompt sent to {order.customerPhone ?? "your phone"}.
              </li>
              <li>
                <span className="font-medium text-foreground">3. Delivery hand-off:</span> Track progress from the orders dashboard.
              </li>
            </ol>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild>
              <Link href={`/orders/${order.id}`}>Track this order</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Add more items</Link>
            </Button>
          </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
