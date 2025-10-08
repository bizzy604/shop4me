"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Receipt, DollarSign, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";
import { addOrderExpense } from "@/app/admin/orders/actions";

interface ExpenseTrackerProps {
  order: {
    id: string;
    expenses: Array<{
      id: string;
      cost: { toNumber(): number };
      deliveryFee: { toNumber(): number } | null;
      note: string | null;
      evidenceUrl: string | null;
      createdAt: Date;
      enteredBy: {
        name: string | null;
        email: string | null;
      } | null;
    }>;
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ExpenseTracker({ order }: ExpenseTrackerProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    formData.set("orderId", order.id);

    setFormError(null);

    startTransition(async () => {
      const result = await addOrderExpense(formData);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error || "Failed to add expense");
      } else {
        setShowAddForm(false);
        toast.success("Expense added successfully!");
        // Reset form
        event.currentTarget.reset();
      }
    });
  };

  const totalExpenses = order.expenses.reduce((sum, expense) => {
    return sum + expense.cost.toNumber() + (expense.deliveryFee?.toNumber() || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Expenses
            </CardTitle>
            <CardDescription>
              Track shopping costs, delivery fees, and other expenses
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Expenses */}
        {order.expenses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recorded Expenses</h4>
            {order.expenses.map((expense) => (
              <div key={expense.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatCurrency(expense.cost.toNumber())}
                      </span>
                      {expense.deliveryFee && (
                        <>
                          <span className="text-muted-foreground">+</span>
                          <span className="text-sm">
                            {formatCurrency(expense.deliveryFee.toNumber())} delivery
                          </span>
                        </>
                      )}
                    </div>
                    {expense.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{expense.note}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(expense.createdAt)}</span>
                      {expense.enteredBy && (
                        <span>by {expense.enteredBy.name || expense.enteredBy.email}</span>
                      )}
                      {expense.evidenceUrl && (
                        <a 
                          href={expense.evidenceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Expense Form */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
            <h4 className="text-sm font-medium">Add New Expense</h4>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="cost">Shopping Cost (KES) *</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Delivery Fee (KES)</Label>
                <Input
                  id="deliveryFee"
                  name="deliveryFee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Details about this expense (optional)..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="evidenceUrl">Receipt/Evidence URL</Label>
              <Input
                id="evidenceUrl"
                name="evidenceUrl"
                type="url"
                placeholder="https://... (optional)"
              />
            </div>

            {formError && (
              <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </CardContent>
    </Card>
  );
}