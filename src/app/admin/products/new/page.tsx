import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Add New Product | Admin | Shop4Me",
};

export default async function NewProductPage() {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent("/admin/products/new"));
  }

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
          <h1 className="text-3xl font-semibold tracking-tight">Add New Product</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new product for your catalog
          </p>
        </div>
      </div>

      <ProductForm />
    </main>
  );
}