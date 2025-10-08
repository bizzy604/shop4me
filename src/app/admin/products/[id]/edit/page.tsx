import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import { ProductForm } from "@/components/admin/product-form";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Product | Admin | Shop4Me",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent(`/admin/products/${id}/edit`));
  }

  // Fetch the product
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Convert Decimal to number for client component
  const productForForm = {
    ...product,
    price: product.price.toNumber(),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to products
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit Product</h1>
          <p className="mt-2 text-muted-foreground">
            Make changes to {product.name}
          </p>
        </div>
      </div>

      <ProductForm product={productForForm} />
    </main>
  );
}