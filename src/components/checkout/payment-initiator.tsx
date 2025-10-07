"use client";

import { useState, useTransition } from "react";
import { Loader2, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

import { initiatePayment } from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";

interface PaymentInitiatorProps {
  orderId: string;
  totalAmount: number;
  customerPhone?: string | null;
  paymentStatus: string;
  orderStatus: string;
}

export function PaymentInitiator({ 
  orderId, 
  totalAmount, 
  customerPhone, 
  paymentStatus, 
  orderStatus 
}: PaymentInitiatorProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [customerMessage, setCustomerMessage] = useState<string | null>(null);

  // Don't show payment initiator if already paid or cancelled
  if (paymentStatus === 'PAID' || orderStatus === 'CANCELLED' || orderStatus === 'DELIVERED') {
    return null;
  }

  // Show success message if payment was just initiated
  if (paymentInitiated) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <CheckCircle className="h-5 w-5" />
            Payment Request Sent
          </CardTitle>
          <CardDescription className="text-emerald-800">
            {customerMessage || "Check your phone for the M-Pesa payment prompt."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-emerald-900">
          <p>
            The payment request has been sent to your phone. Please complete the payment using your M-Pesa PIN 
            to proceed with your order.
          </p>
          <p className="mt-2 text-xs">
            If you don&apos;t receive the prompt within 2-3 minutes, you can try initiating payment again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("orderId", orderId);

    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await initiatePayment(formData);
      if (result.ok) {
        setPaymentInitiated(true);
        setCustomerMessage(result.customerMessage || null);
      } else {
        setFormError(result.formError ?? null);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <Card className="border-blue-500/30 bg-blue-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription className="text-blue-800">
          Ready to pay? We&apos;ll send an M-Pesa STK push to your phone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Amount to pay: {formatCurrency(totalAmount)}</p>
            <p className="text-xs mt-1">
              This amount may be adjusted after shopping based on actual prices and availability.
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-blue-900">
              M-Pesa phone number <span className="text-red-600">*</span>
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="0712 345 678"
              defaultValue={customerPhone || ""}
              required
              className="mt-1"
              aria-invalid={Boolean(fieldErrors.phone)}
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
            ) : null}
            <p className="mt-1 text-xs text-blue-800">
              Make sure this number can receive M-Pesa STK push notifications.
            </p>
          </div>

          {formError ? (
            <div className="flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Send M-Pesa Payment Request
              </>
            )}
          </Button>

          <p className="text-xs text-blue-800">
            By clicking &quot;Send M-Pesa Payment Request&quot;, you agree to pay the amount shown above. 
            The actual charge may vary based on final shopping results.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}