"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentStatusCheckerProps {
  orderId: string;
  initialPaymentStatus: string;
  initialOrderStatus: string;
  checkoutRequestId?: string | null;
}

type OrderStatus = {
  paymentStatus: string;
  orderStatus: string;
  mpesaReceipt?: string | null;
};

export function PaymentStatusChecker({ 
  orderId, 
  initialPaymentStatus, 
  initialOrderStatus,
  checkoutRequestId 
}: PaymentStatusCheckerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>({
    paymentStatus: initialPaymentStatus,
    orderStatus: initialOrderStatus,
  });
  const [isPolling, setIsPolling] = useState(false);

  // Start polling when payment is pending and STK push was initiated
  const shouldPoll = status.paymentStatus === 'PENDING' && checkoutRequestId;

  useEffect(() => {
    if (!shouldPoll) return;

    setIsPolling(true);
    let pollCount = 0;
    const maxPolls = 60; // Poll for up to 5 minutes (5s intervals)
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        if (response.ok) {
          const data = await response.json();
          
          // Update status if it changed
          const newStatus = {
            paymentStatus: data.paymentStatus,
            orderStatus: data.orderStatus,
            mpesaReceipt: data.mpesaReceipt,
          };
          
          // Only update if status actually changed
          if (newStatus.paymentStatus !== status.paymentStatus || 
              newStatus.orderStatus !== status.orderStatus) {
            setStatus(newStatus);
          }

          // Stop polling if payment is complete or failed
          if (data.paymentStatus === 'PAID' || data.paymentStatus === 'FAILED') {
            setIsPolling(false);
            // Refresh the page to show updated status
            router.refresh();
            return;
          }
        } else {
          console.warn('Failed to fetch order status:', response.status);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        // Don't stop polling on network errors, just log them
      }

      pollCount++;
      if (pollCount >= maxPolls) {
        setIsPolling(false);
        console.log('Payment status polling stopped - maximum attempts reached');
        return;
      }

      // Continue polling with exponential backoff after first few attempts
      const delay = pollCount < 10 ? 5000 : Math.min(10000, 5000 * Math.pow(1.2, pollCount - 10));
      timeoutId = setTimeout(poll, delay);
    };

    // Start polling after 3 seconds (give M-Pesa time to process)
    timeoutId = setTimeout(poll, 3000);

    return () => {
      clearTimeout(timeoutId);
      setIsPolling(false);
    };
  }, [orderId, shouldPoll, router, status.paymentStatus, status.orderStatus]);

  // Don't render if payment is already complete
  if (status.paymentStatus === 'PAID' || status.paymentStatus === 'FAILED') {
    return null;
  }

  // Show pending payment status with polling indicator
  if (status.paymentStatus === 'PENDING' && checkoutRequestId) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            {isPolling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
            Payment Pending
          </CardTitle>
          <CardDescription className="text-amber-800">
            Waiting for M-Pesa payment confirmation...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900">
          <div className="flex items-center justify-between">
            <span>Payment Status:</span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {isPolling ? "Checking..." : "Pending"}
            </Badge>
          </div>
          
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="font-medium">Complete your M-Pesa payment:</p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-xs">
              <li>Check your phone for the M-Pesa payment prompt</li>
              <li>Enter your M-Pesa PIN to authorize the payment</li>
              <li>Wait for payment confirmation (this page will update automatically)</li>
            </ol>
          </div>

          {isPolling && (
            <p className="text-xs text-amber-700">
              🔄 Automatically checking payment status... This may take up to 2-3 minutes.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}