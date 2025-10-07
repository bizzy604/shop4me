/**
 * Product Status Toggle Component
 * 
 * This component provides a toggle button for admin users to activate/deactivate
 * products. It includes confirmation dialogs and handles the server action
 * for status updates with proper error handling and user feedback.
 * 
 * Dependencies:
 * - Server actions for product status updates
 * - Alert dialog for confirmation
 * - Toast notifications for feedback
 */

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toggleProductStatus } from "@/app/admin/products/actions";

interface ProductStatusToggleProps {
  productId: string;
  productName: string;
  isActive: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ProductStatusToggle({
  productId,
  productName,
  isActive,
  variant = "outline",
  size = "sm",
}: ProductStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleProductStatus(productId);
        
        if (result.success) {
          toast.success(
            isActive 
              ? `${productName} has been deactivated`
              : `${productName} has been activated`
          );
          setIsOpen(false);
        } else {
          toast.error(result.error || "Failed to update product status");
        }
      } catch (error) {
        console.error("Status toggle error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  const Icon = isActive ? PowerOff : Power;
  const actionText = isActive ? "Deactivate" : "Activate";
  const confirmationText = isActive 
    ? "This will hide the product from customers. Orders with this product will not be affected."
    : "This will make the product visible to customers again.";

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isPending}>
          <Icon className="mr-2 h-4 w-4" />
          {actionText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {actionText} Product
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {actionText.toLowerCase()} &apos;{productName}&apos;?
            <br />
            <br />
            {confirmationText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={isPending}
            className={isActive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isPending ? "Processing..." : `${actionText} Product`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}