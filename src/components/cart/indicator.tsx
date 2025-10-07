"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/currency";

export function CartIndicator() {
  const { itemCount, subtotal } = useCart();

  return (
    <Link href="/cart" aria-label="View cart" className="group">
      <Button variant="outline" size="sm" className="gap-2">
        <ShoppingCart className="h-4 w-4" />
        <span className="hidden sm:inline">Cart</span>
        <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
          {itemCount}
        </span>
        {itemCount > 0 ? (
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {formatCurrency(subtotal)}
          </span>
        ) : null}
      </Button>
    </Link>
  );
}
