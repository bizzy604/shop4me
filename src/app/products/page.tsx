import Link from "next/link";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProductGroup = {
  category: string;
  items: Array<{
    id: string;
    slug: string;
    name: string;
    unit?: string | null;
    priceNote?: string | null;
    price: number;
    priceLabel: string;
    isCustom: boolean;
  }>;
};

/**
 * Transforms raw Prisma product records into UI friendly groupings. We precompute
 * price labels and bucket products by category so the server-rendered catalogue
 * stays fast and predictable even as content grows.
 */
function groupProducts(products: Awaited<ReturnType<typeof prisma.product.findMany>>): ProductGroup[] {
  const map = new Map<string, ProductGroup>();

  for (const product of products) {
    const category = product.category ?? "Everyday essentials";
    const priceNumber = product.price.toNumber();
    const priceLabel = formatCurrency(priceNumber);

    if (!map.has(category)) {
      map.set(category, { category, items: [] });
    }

    map.get(category)!.items.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      priceNote: product.priceNote,
      price: priceNumber,
      priceLabel,
      isCustom: product.slug === "custom-item",
    });
  }

  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Server-rendered catalogue landing that highlights grouped product estimates and
 * funnels shoppers towards detail pages or quick add-to-cart actions. By doing the
 * heavy lifting on the server, we keep the experience cacheable while still showing
 * the latest price guidance pulled straight from Prisma.
 */
export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const grouped = groupProducts(products);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Browse the catalogue</h1>
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Real shoppers · Same-day delivery
          </Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground">
          Prices listed include our service fee and may adjust slightly once receipts are reconciled. We always confirm any changes before payment is due.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {grouped.map((group) => (
          <Card key={group.category} className="flex h-full flex-col border-muted-foreground/15 shadow-sm">
            <CardHeader>
              <CardTitle>{group.category}</CardTitle>
              <CardDescription>Estimated market pricing — final totals confirmed after shopping.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-5">
              {group.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-muted/40 p-4 shadow-xs">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-semibold hover:text-primary hover:underline">
                        {item.name}
                      </Link>
                      {item.unit ? <p className="text-xs text-muted-foreground">{item.unit}</p> : null}
                    </div>
                    <span className="text-sm font-semibold text-primary">{item.priceLabel}</span>
                  </div>
                  {item.priceNote ? <p className="text-xs text-muted-foreground">{item.priceNote}</p> : null}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link href={`/products/${item.slug}`} className="font-medium text-primary hover:underline">
                        View details
                      </Link>
                      {item.isCustom ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          Describe at checkout
                        </Badge>
                      ) : null}
                    </div>
                    <AddToCartButton
                      product={{
                        id: item.id,
                        slug: item.slug,
                        name: item.name,
                        price: item.price,
                        unit: item.unit,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t bg-muted/30 text-sm text-muted-foreground">
              <div className="flex w-full items-center justify-between">
                <span>Need bulk or a special request?</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/checkout">Submit custom order</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </section>
    </main>
  );
}
