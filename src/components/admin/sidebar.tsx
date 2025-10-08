'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3,
  ChevronLeft,
  Menu,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useUser } from "@stackframe/stack";

/**
 * Admin Sidebar Navigation Component
 * 
 * Purpose:
 * - Provides dedicated navigation for admin users
 * - Displays admin-specific menu items (Dashboard, Products, Orders, Summary)
 * - Collapsible sidebar for better space management
 * - Shows user information and logout functionality
 * 
 * Dependencies:
 * - Used in: /app/admin/layout.tsx
 * - Links to: Admin pages (/admin, /admin/products, /admin/orders, /admin/summary)
 * - Uses: shadcn/ui Button component, Stack auth for user info
 */

const ADMIN_NAV_LINKS = [
  { 
    href: "/admin", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    exact: true,
  },
  { 
    href: "/admin/products", 
    label: "Products", 
    icon: Package,
  },
  { 
    href: "/admin/orders", 
    label: "Orders", 
    icon: ShoppingCart,
  },
  { 
    href: "/admin/summary", 
    label: "Summary", 
    icon: BarChart3,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-background border-r transition-all duration-300",
          "md:sticky md:top-0",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isCollapsed && (
              <Link href="/admin" className="text-xl font-bold tracking-tight">
                Shop4Me Admin
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("hidden md:flex", isCollapsed && "mx-auto")}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {ADMIN_NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href, link.exact);
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-muted",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="border-t p-4 space-y-2">
            {/* Theme Toggle */}
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <ThemeToggle />
              {!isCollapsed && (
                <span className="text-sm text-muted-foreground">Theme</span>
              )}
            </div>

            {/* User Info */}
            {user && !isCollapsed && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.displayName || user.primaryEmail || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            )}

            {/* Back to Store Link */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? "Back to Store" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Back to Store</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
