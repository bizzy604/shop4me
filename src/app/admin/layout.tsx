import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminFooter } from "@/components/admin/footer";
import { Toaster } from "@/components/ui/sonner";

/**
 * Admin Layout Component
 * 
 * Purpose:
 * - Provides a dedicated layout for all admin pages
 * - Includes the AdminSidebar component for navigation
 * - Removes the customer header from admin pages
 * - Creates a proper admin dashboard experience
 * - Includes Toaster for toast notifications
 * - Includes AdminFooter for copyright information
 * 
 * Dependencies:
 * - Used by: All pages under /app/admin/*
 * - Components: AdminSidebar, AdminFooter, Toaster
 * 
 * Why this is important:
 * - Separates admin UI from customer-facing UI
 * - Provides consistent navigation across all admin pages
 * - Improves admin user experience with sidebar navigation
 * - Shows success/error notifications for admin actions
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/10">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
        <AdminFooter />
      </div>
      <Toaster />
    </div>
  );
}
