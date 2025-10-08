import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Plus,
  ArrowLeft,
  Package,
  Search,
  Edit,
  Eye,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { ProductStatusToggle } from "@/components/admin/product-status-toggle";

export const metadata: Metadata = {
  title: "Product Management | Admin | Shop4Me",
};

interface SearchParams {
  search?: string;
  category?: string;
  status?: string;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent("/admin/products"));
  }

  const params = await searchParams;
  const search = params.search || "";
  const categoryFilter = params.category || "";
  const statusFilter = params.status || "";

  // Build where clause for filtering
  const where: Record<string, unknown> = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (categoryFilter) {
    where.category = { contains: categoryFilter, mode: "insensitive" };
  }
  
  if (statusFilter === "active") {
    where.isActive = true;
  } else if (statusFilter === "inactive") {
    where.isActive = false;
  }

  // Fetch products and statistics
  const [products, totalProducts, activeProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.groupBy({
      by: ["category"],
      where: { category: { not: null } },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Product Management</h1>
            <p className="mt-2 text-muted-foreground">
              Create, edit, and manage your product catalog
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Filtered products</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                name="search"
                placeholder="Search products..."
                defaultValue={search}
                className="w-full"
              />
            </div>
            <div className="min-w-[150px]">
              <select
                name="category"
                defaultValue={categoryFilter}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category || ""}>
                    {cat.category} ({cat._count.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Filter
            </Button>
            {(search || categoryFilter || statusFilter) && (
              <Button variant="ghost" asChild>
                <Link href="/admin/products">Clear</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {search || categoryFilter || statusFilter
                ? "Try adjusting your search criteria"
                : "Get started by creating your first product"}
            </p>
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {product.category && (
                        <Badge variant="secondary" className="text-xs mr-2">
                          {product.category}
                        </Badge>
                      )}
                      {product.unit && (
                        <span className="text-xs text-muted-foreground">
                          per {product.unit}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {formatCurrency(product.price.toNumber())}
                    </p>
                    {product.priceNote && (
                      <p className="text-xs text-muted-foreground">
                        {product.priceNote}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {product._count.orderItems} orders
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
                
                <div className="pt-2 border-t">
                  <ProductStatusToggle
                    productId={product.id}
                    productName={product.name}
                    isActive={product.isActive}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}