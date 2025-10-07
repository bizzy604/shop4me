/**
 * Admin Product Management Server Actions
 * 
 * This module provides server-side actions for CRUD operations on products.
 * These actions are restricted to admin users only and handle product creation,
 * updates, and deletion with proper validation and error handling.
 * 
 * Dependencies:
 * - Prisma client for database operations
 * - Stack Auth for admin verification
 * - Next.js revalidation for cache invalidation
 */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

import { isCurrentUserAdmin } from "@/lib/user-persistence";
import prisma from "@/lib/prisma";

// Validation schema for product data
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.string().refine((val: string) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a valid positive number"),
  unit: z.string().optional(),
  priceNote: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Creates a new product
 * Only accessible by admin users
 */
export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    // Verify admin access
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access" };
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      category: formData.get("category") as string || undefined,
      price: formData.get("price") as string,
      unit: formData.get("unit") as string || undefined,
      priceNote: formData.get("priceNote") as string || undefined,
      imageUrl: formData.get("imageUrl") as string || undefined,
      isActive: formData.get("isActive") === "true",
    };

    const validatedData = productSchema.parse(rawData);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return { success: false, error: "A product with this slug already exists" };
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        price: new Decimal(validatedData.price),
        imageUrl: validatedData.imageUrl || null,
        description: validatedData.description || null,
        category: validatedData.category || null,
        unit: validatedData.unit || null,
        priceNote: validatedData.priceNote || null,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true, data: product };
  } catch (error) {
    console.error("Failed to create product:", error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map((e: { message: string }) => e.message).join(", ") 
      };
    }
    
    return { success: false, error: "Failed to create product" };
  }
}

/**
 * Updates an existing product
 * Only accessible by admin users
 */
export async function updateProduct(productId: string, formData: FormData): Promise<ActionResult> {
  try {
    // Verify admin access
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access" };
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || undefined,
      category: formData.get("category") as string || undefined,
      price: formData.get("price") as string,
      unit: formData.get("unit") as string || undefined,
      priceNote: formData.get("priceNote") as string || undefined,
      imageUrl: formData.get("imageUrl") as string || undefined,
      isActive: formData.get("isActive") === "true",
    };

    const validatedData = productSchema.parse(rawData);

    // Check if slug conflicts with another product
    const conflictingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (conflictingProduct && conflictingProduct.id !== productId) {
      return { success: false, error: "A product with this slug already exists" };
    }

    // Update the product
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...validatedData,
        price: new Decimal(validatedData.price),
        imageUrl: validatedData.imageUrl || null,
        description: validatedData.description || null,
        category: validatedData.category || null,
        unit: validatedData.unit || null,
        priceNote: validatedData.priceNote || null,
      },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return { success: true, data: product };
  } catch (error) {
    console.error("Failed to update product:", error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map((e: { message: string }) => e.message).join(", ") 
      };
    }
    
    return { success: false, error: "Failed to update product" };
  }
}

/**
 * Deletes a product
 * Only accessible by admin users
 * Soft delete by setting isActive to false if product has order items
 */
export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    // Verify admin access
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access" };
    }

    // Check if product exists and has order items
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product._count.orderItems > 0) {
      // Soft delete: deactivate product instead of deleting
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
    } else {
      // Hard delete: no order items reference this product
      await prisma.product.delete({
        where: { id: productId },
      });
    }

    // Revalidate relevant pages
    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

/**
 * Toggle product active status
 * Only accessible by admin users
 */
export async function toggleProductStatus(productId: string): Promise<ActionResult> {
  try {
    // Verify admin access
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access" };
    }

    // Get current product status
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isActive: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Toggle status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });

    // Revalidate relevant pages
    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Failed to toggle product status:", error);
    return { success: false, error: "Failed to update product status" };
  }
}