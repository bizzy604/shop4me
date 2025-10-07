"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatus } from "@/app/admin/orders/actions";

const ORDER_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface OrderStatusUpdaterProps {
  order: {
    id: string;
    orderStatus: string;
    paymentStatus: string;
  };
}

export function OrderStatusUpdater({ order }: OrderStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState(order.orderStatus);
  const [note, setNote] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (selectedStatus === order.orderStatus && !note.trim()) {
      setFormError("No changes to save. Update status or add a note.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("orderId", order.id);
    formData.set("status", selectedStatus);
    formData.set("note", note);

    setFormError(null);

    startTransition(async () => {
      const result = await updateOrderStatus(formData);
      if (!result.ok) {
        setFormError(result.error || "Failed to update order status");
      } else {
        setNote(""); // Clear note after successful update
        // Show success feedback could be added here
      }
    });
  };

  // Warn about status transitions that might not make sense
  const getStatusWarning = (newStatus: string) => {
    if (order.paymentStatus === "PENDING" && ["SHOPPING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(newStatus)) {
      return "Payment is still pending. Consider waiting for payment confirmation.";
    }
    if (order.orderStatus === "DELIVERED" && newStatus !== "DELIVERED") {
      return "This order is already marked as delivered. Are you sure you want to change it?";
    }
    if (order.orderStatus === "CANCELLED" && newStatus !== "CANCELLED") {
      return "This order was cancelled. Are you sure you want to reactivate it?";
    }
    return null;
  };

  const statusWarning = selectedStatus !== order.orderStatus ? getStatusWarning(selectedStatus) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order Status</CardTitle>
        <CardDescription>
          Change the order status and optionally add a note for the customer or team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Current Payment Status</Label>
              <div className="flex h-10 items-center">
                <Badge variant="outline">
                  {order.paymentStatus.toLowerCase().split("_").map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(" ")}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="note">Status Update Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this status change (visible to customer and team)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {statusWarning && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{statusWarning}</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{formError}</span>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isPending || (selectedStatus === order.orderStatus && !note.trim())}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Status
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}