import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import prisma from "@/lib/prisma";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
    },
  });

  if (!product) {
    return {
      title: "Product not found | Shop4Me",
    };
  }

  return {
    title: `${product.name} | Shop4Me`,
    description:
      product.description ??
      "Check live market pricing for essentials in Lodwar and request verified shoppers to deliver them the same day.",
  };
}

/**
 * Server component that renders a detailed view for a single catalogue entry. It supplies
 * full context (pricing, notes, unit, description) and wires the add-to-cart button so the
 * marketing site, cart, and checkout flows all reference the same product payload.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const priceNumber = product.price.toNumber();
  const priceLabel = formatCurrency(priceNumber);

  const relatedProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      slug: { not: slug },
      category: product.category ?? undefined,
    },
    orderBy: { name: "asc" },
    take: 4,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-12 px-4 sm:px-6 py-6 sm:py-10">
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Link href="/products" className="transition hover:text-primary">
          Products
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[2fr,1fr] lg:items-start">
        <article className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs uppercase tracking-wide">
              {product.category ?? "Everyday essentials"}
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">{product.name}</h1>
            {product.unit ? <p className="text-xs sm:text-sm text-muted-foreground">Packed as: {product.unit}</p> : null}
          </div>

          {product.imageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl border bg-muted">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 600px, 100vw"
                priority
              />
            </div>
          ) : null}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">What to expect</CardTitle>
              <CardDescription className="text-xs sm:text-sm">We reconcile any difference with you over WhatsApp before completing delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <p>
                {product.description ??
                  "Our shopper will look for the freshest stock in Lodwar markets and confirm availability before initiating payment."}
              </p>
              {product.priceNote ? <p className="leading-relaxed">{product.priceNote}</p> : null}
              <ul className="list-disc space-y-2 pl-5">
                <li>Free cart review before payment; only pay once the M-Pesa prompt appears.</li>
                <li>Delivery within Lodwar township in under four hours for most orders.</li>
                <li>Receive digital receipts for easy reconciliation and expense tracking.</li>
              </ul>
            </CardContent>
          </Card>
        </article>

        <aside className="space-y-4 sm:space-y-6">
          <Card className="border-primary/20 shadow-sm lg:sticky lg:top-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl sm:text-2xl">{priceLabel}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Estimated price based on recent market checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-muted-foreground">
              <p>Includes shopper coordination. Delivery fee is reconciled separately after drop-off.</p>
              {product.unit ? <p>Standard quantity: {product.unit}.</p> : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:gap-3">
              <AddToCartButton
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: priceNumber,
                  unit: product.unit,
                  imageUrl: product.imageUrl,
                }}
                size="lg"
              />
              <Button variant="outline" asChild>
                <Link href="/checkout">Go to checkout</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Need a different quantity or brand? Add this item and leave specific notes at checkout—we&apos;ll confirm before we shop.
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Have questions?</CardTitle>
              <CardDescription>Chat with an agent on WhatsApp for substitutions or rush delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="secondary">
                <Link href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer">
                  Message support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">You might also like</h2>
            <Button variant="ghost" asChild size="sm">
              <Link href="/products">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => {
              const relatedPrice = related.price.toNumber();
              return (
                <Card key={related.id} className="border-muted-foreground/20 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      <Link href={`/products/${related.slug}`} className="hover:underline">
                        {related.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>{related.unit}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0 text-sm text-muted-foreground">
                    {related.priceNote ?? "Final total shared before payment."}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-3 border-t bg-muted/40 py-3 text-sm">
                    <span className="font-semibold text-primary">{formatCurrency(relatedPrice)}</span>
                    <AddToCartButton
                      product={{
                        id: related.id,
                        slug: related.slug,
                        name: related.name,
                        price: relatedPrice,
                        unit: related.unit,
                        imageUrl: related.imageUrl,
                      }}
                      size="sm"
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
