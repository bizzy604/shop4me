import Link from "next/link";
import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout | Shop4Me",
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Step 2 of 3</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where should we deliver?</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Confirm your contact info and delivery location so our shopper can get in touch as soon as your order is ready.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/cart">Back to cart</Link>
          </Button>
        </div>
      </div>

      <CheckoutForm />
    </main>
  );
}
