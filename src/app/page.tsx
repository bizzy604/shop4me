import Link from "next/link";

import { CartIndicator } from "@/components/cart/indicator";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

const shoppingSteps = [
  {
    title: "Tell us what you need",
    description: "Browse curated essentials or request a custom item during checkout.",
  },
  {
    title: "Pay securely with M-Pesa",
    description: "We trigger an STK Push and confirm your payment instantly.",
  },
  {
    title: "Relax while we shop & deliver",
    description: "A verified shopper buys, reconciles costs, and delivers within 4 hours.",
  },
];

export default async function Home() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, slug: { not: "custom-item" } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 6,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const supportedCategories = categories
    .map((entry) => entry.category ?? "Miscellaneous")
    .filter((value, index, self) => value && self.indexOf(value) === index);

  return (
    <div className="flex w-full flex-col gap-8 sm:gap-12">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 md:p-10 shadow-sm">
          <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4 sm:space-y-6">
              <Badge variant="secondary" className="rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm">Now serving Lodwar</Badge>
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                  Shop local markets without leaving home.
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  We shop from trusted Lodwar vendors, pay with M-Pesa on your behalf, and deliver everything to your doorstep the same day.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button size="lg" asChild className="text-sm sm:text-base">
                  <Link href="/products">Browse catalogue</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-sm sm:text-base">
                  <Link href="/checkout">Place an order</Link>
                </Button>
                <div className="hidden sm:block">
                  <CartIndicator />
                </div>
              </div>
            </div>
            <Card className="w-full max-w-md border-none bg-background/70 shadow-lg backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">How it works</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Three simple steps to get essentials delivered.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {shoppingSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 sm:gap-4">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-xs sm:text-sm font-semibold text-primary flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{step.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">Popular picks this week</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Curated staples with upfront estimates. Tap to customise quantities.</CardDescription>
              </div>
              <Button variant="ghost" asChild className="self-start sm:self-auto">
                <Link href="/products" className="text-sm">View full catalogue</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => {
                  const priceNumber = product.price.toNumber();
                  return (
                    <Card key={product.id} className="border-muted-foreground/10 shadow-none transition hover:-translate-y-1 hover:shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">
                          <Link href={`/products/${product.slug}`} className="hover:underline">
                            {product.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>{product.unit}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 pt-0 text-sm text-muted-foreground">
                        {product.priceNote ?? "Price confirmed after shopping."}
                      </CardContent>
                      <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 py-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="text-sm font-semibold text-primary">
                            {formatCurrency(priceNumber)}
                          </div>
                        </div>
                        <div className="w-full">
                          <AddToCartButton
                            product={{
                              id: product.id,
                              slug: product.slug,
                              name: product.name,
                              price: priceNumber,
                              unit: product.unit,
                              imageUrl: product.imageUrl,
                            }}
                            size="sm"
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>What we shop</CardTitle>
              <CardDescription>We cover high-demand categories in Lodwar markets and supermarkets.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {supportedCategories.map((category) => (
                <Badge key={category} variant="secondary" className="px-3 py-1 text-sm">
                  {category}
                </Badge>
              ))}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Need something else? Choose “Custom Item Request” at checkout and describe what you want.
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Transparent pricing</CardTitle>
              <CardDescription>See estimates upfront and approve any changes via WhatsApp.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Live order tracking</CardTitle>
              <CardDescription>Follow progress from shopping to delivery in your orders dashboard.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Local shopper network</CardTitle>
              <CardDescription>Trusted shoppers who know Lodwar markets inside out.</CardDescription>
            </CardHeader>
          </Card>
        </section>
    </div>
  );
}
