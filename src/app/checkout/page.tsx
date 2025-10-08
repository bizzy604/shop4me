import Link from "next/link";
import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout | Shop4Me",
};

export default function CheckoutPage() {
  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-muted-foreground">Step 2 of 3</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mt-1">Where should we deliver?</h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground">
              Confirm your contact info and delivery location so our shopper can get in touch as soon as your order is ready.
            </p>
          </div>
          <Button variant="outline" asChild className="self-start sm:self-auto text-sm">
            <Link href="/cart">Back to cart</Link>
          </Button>
        </div>
      </div>

      <CheckoutForm />
    </div>
  );
}
