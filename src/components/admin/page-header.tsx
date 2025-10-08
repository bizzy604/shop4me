import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Admin Page Header Component
 * 
 * Purpose:
 * - Provides consistent page headers across admin pages
 * - Displays page title, description, and optional actions
 * - Creates a professional admin interface
 * 
 * Dependencies:
 * - Used in: Admin pages (/admin/*, /admin/products/*, etc.)
 * 
 * Why this is important:
 * - Ensures consistent styling and structure across admin pages
 * - Makes admin pages more professional and user-friendly
 * - Provides clear context for each admin section
 */

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ 
  title, 
  description, 
  actions,
  className 
}: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
