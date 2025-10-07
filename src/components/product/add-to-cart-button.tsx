"use client";

import { useMemo } from "react";
import { Plus, Minus } from "lucide-react";

import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type BasicProduct = {
  id: string;
  slug?: string | null;
  name: string;
  price: number;
  unit?: string | null;
  imageUrl?: string | null;
};

type AddToCartButtonProps = {
  /**
   * Product payload to persist in the cart. The button never mutates this object
   * and only forwards its primitive fields to the cart provider so we don&apos;t
   * introduce stale references when product data updates on the server.
   */
  product: BasicProduct;
  /**
   * Optional size forwarded to the underlying button component so list views can
   * render a compact call-to-action while product detail pages show a full-width CTA.
   */
  size?: "default" | "sm" | "lg";
  /**
   * Extra classes applied when the button is in its inactive state (before an item
   * exists in the cart). Useful for grids that need matching height alignment.
   */
  className?: string;
};

/**
 * Client-side control that bridges product listings with the cart provider.
 * It detects whether the given product already exists in the cart and swaps
 * between a simple “Add to cart” CTA and an inline quantity stepper. This
 * component is crucial for maintaining a consistent add/update experience across
 * the catalogue, landing page tiles, and product detail screens while keeping
 * cart mutations centralised through the CartProvider context.
 */
export function AddToCartButton({ product, size = "default", className }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity } = useCart();

  const currentItem = useMemo(
    () => items.find((item) => item.productId === product.id),
    [items, product.id],
  );

  if (currentItem) {
    return (
      <div className="flex items-center justify-between w-full gap-1">
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "icon"}
          className={size === "sm" ? "h-8 w-8 p-0" : ""}
          aria-label={`Decrease ${product.name}`}
          onClick={() => updateQuantity(currentItem.id, currentItem.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="flex flex-col items-center min-w-0 flex-1">
          <span className="text-xs font-semibold leading-none">{currentItem.quantity}</span>
          <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
            {formatCurrency(currentItem.price * currentItem.quantity)}
          </span>
        </div>
        <Button
          variant="default"
          size={size === "sm" ? "sm" : "icon"}
          className={size === "sm" ? "h-8 w-8 p-0" : ""}
          aria-label={`Increase ${product.name}`}
          onClick={() => updateQuantity(currentItem.id, currentItem.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size={size}
      className={cn("w-full", className)}
      onClick={() =>
        addItem(
          {
            id: product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            imageUrl: product.imageUrl,
          },
          1,
        )
      }
    >
      <span>Add to cart</span>
      <span className="sr-only">{formatCurrency(product.price)}</span>
    </Button>
  );
}
