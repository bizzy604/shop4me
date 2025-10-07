"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Header } from "@/components/header";
import { useCart, DEFAULT_SERVICE_FEE } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";

export default function CartPage() {
  const { items, itemCount, subtotal, total, serviceFee, setServiceFee, updateQuantity, removeItem, addItem, hydrated } = useCart();
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const handleServiceFeeChange = (value: string) => {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed)) {
      setServiceFee(parsed);
    }
  };

  const handleAddCustomItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = customName.trim();
    const price = Number(customPrice);

    if (!name || !Number.isFinite(price) || price <= 0) {
      return;
    }

    const productId = `custom-${Date.now()}`;
    addItem(
      {
        id: productId,
        productId,
        name: customNotes ? `${name} (${customNotes})` : name,
        price,
        unit: customUnit || undefined,
      },
      1,
    );

    setCustomName("");
    setCustomPrice("");
    setCustomUnit("");
    setCustomNotes("");
  };

  return (
    <div className="min-h-screen p-6 pb-16">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="flex flex-col gap-6 md:flex-row md:items-start">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Your cart ({itemCount} {itemCount === 1 ? "item" : "items"})</CardTitle>
              <CardDescription>
                Review quantities before checkout. We will reconcile final totals after our shopper confirms market prices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hydrated ? (
                <p className="text-sm text-muted-foreground">Loading your cart…</p>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                  Your cart is empty. <Link href="/products" className="font-medium text-primary">Browse products</Link> to start a request.
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium leading-tight">{item.name}</p>
                        {item.unit ? (
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                        ) : null}
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Increase ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            {items.length > 0 ? (
              <CardFooter className="justify-between border-t bg-muted/50 py-4 text-sm text-muted-foreground">
                <Link href="/products" className="transition hover:text-primary">
                  + Add more items
                </Link>
              </CardFooter>
            ) : null}
          </Card>

          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cost summary</CardTitle>
              <CardDescription>Service fee covers shopper time and coordination. Delivery is reconciled after drop-off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Items subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="serviceFee" className="flex-1">
                  Service fee
                </label>
                <Input
                  id="serviceFee"
                  type="number"
                  min={0}
                  step={50}
                  value={serviceFee}
                  onChange={(event) => handleServiceFeeChange(event.target.value)}
                  className="w-24 text-right"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Default fee is KES {DEFAULT_SERVICE_FEE}. Adjust if coordinating a larger run or off-hours delivery.
              </p>
              <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Estimated total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Link href="/checkout" className="w-full" aria-disabled={items.length === 0}>
                <Button className="w-full" disabled={items.length === 0}>
                  Proceed to checkout
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                You&apos;ll confirm delivery details on the next step before we initiate the M-Pesa payment request.
              </p>
            </CardFooter>
          </Card>
        </section>

        <section>
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Add a custom item</CardTitle>
              <CardDescription>
                Can&apos;t find something on the list? Add your own with an estimated price so our shopper can look for it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddCustomItem}>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="customName">
                    Item name
                  </label>
                  <Input
                    id="customName"
                    placeholder="e.g. Fresh sukuma wiki"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="customPrice">
                    Estimated price (KES)
                  </label>
                  <Input
                    id="customPrice"
                    type="number"
                    min={0}
                    step={50}
                    value={customPrice}
                    onChange={(event) => setCustomPrice(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="customUnit">
                    Quantity / unit (optional)
                  </label>
                  <Input
                    id="customUnit"
                    placeholder="e.g. 2 bundles"
                    value={customUnit}
                    onChange={(event) => setCustomUnit(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="customNotes">
                    Shopper notes (optional)
                  </label>
                  <Textarea
                    id="customNotes"
                    placeholder="Quality preferences, brand, or market stall details"
                    value={customNotes}
                    onChange={(event) => setCustomNotes(event.target.value)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">Add custom item</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
