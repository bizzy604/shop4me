/**
 * Product Form Component
 * 
 * This component provides a comprehensive form for creating and editing products.
 * It handles form validation, submission, and provides user feedback for admin
 * product management operations.
 * 
 * Dependencies:
 * - React hooks for form state management
 * - Server actions for product CRUD operations
 * - shadcn/ui components for form elements
 * - Toast notifications for user feedback
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/app/admin/products/actions";

// Type for product with serialized price (number instead of Decimal)
type SerializedProduct = Omit<Product, 'price'> & { price: number };

interface ProductFormProps {
  product?: SerializedProduct;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!product;

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      setErrors({});
      
      try {
        let result;
        
        if (isEditing) {
          result = await updateProduct(product.id, formData);
        } else {
          result = await createProduct(formData);
        }

        if (result.success) {
          toast.success(
            isEditing ? "Product updated successfully!" : "Product created successfully!"
          );
          router.push("/admin/products");
          router.refresh();
        } else {
          if (result.error) {
            // Handle validation errors
            if (result.error.includes("slug already exists")) {
              setErrors({ slug: result.error });
            } else {
              toast.error(result.error);
            }
          }
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slugInput = document.getElementById("slug") as HTMLInputElement;
    
    // Auto-generate slug only if not editing or if slug field is empty
    if (!isEditing || !slugInput.value) {
      slugInput.value = generateSlug(name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Product" : "Create New Product"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update the product information below"
            : "Fill in the details to create a new product"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Fresh Avocados"
              defaultValue={product?.name}
              onChange={handleNameChange}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              name="slug"
              type="text"
              placeholder="e.g., fresh-avocados"
              defaultValue={product?.slug}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be used in the product URL. Only lowercase letters, numbers, and hyphens allowed.
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the product..."
              rows={3}
              defaultValue={product?.description || ""}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              type="text"
              placeholder="e.g., Fruits, Vegetables, Dairy"
              defaultValue={product?.category || ""}
            />
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={product?.price.toString()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                type="text"
                placeholder="e.g., kg, piece, dozen"
                defaultValue={product?.unit || ""}
              />
            </div>
          </div>

          {/* Price Note */}
          <div className="space-y-2">
            <Label htmlFor="priceNote">Price Note</Label>
            <Input
              id="priceNote"
              name="priceNote"
              type="text"
              placeholder="e.g., Price may vary based on season"
              defaultValue={product?.priceNote || ""}
            />
            <p className="text-xs text-muted-foreground">
              Optional note about pricing or availability
            </p>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://example.com/product-image.jpg"
              defaultValue={product?.imageUrl || ""}
            />
            <p className="text-xs text-muted-foreground">
              Direct link to product image
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              value="true"
              defaultChecked={product?.isActive ?? true}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Product is active</Label>
            <p className="text-xs text-muted-foreground ml-2">
              Inactive products will not be visible to customers
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending 
                ? (isEditing ? "Updating..." : "Creating...")
                : (isEditing ? "Update Product" : "Create Product")
              }
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}