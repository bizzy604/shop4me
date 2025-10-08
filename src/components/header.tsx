'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { CartIndicator } from "@/components/cart/indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/orders", label: "My Orders" },
];

/**
 * Header Component
 * 
 * Purpose:
 * - Provides main navigation for customer-facing pages
 * - Displays logo and tagline
 * - Shows navigation links with active state highlighting
 * - Includes cart indicator, user menu, and theme toggle
 * - Responsive mobile menu with hamburger icon
 * 
 * Dependencies:
 * - Used in: /app/layout.tsx (customer pages)
 * - Links to: Main customer pages (products, cart, checkout, orders)
 * - Components: CartIndicator, UserMenu, ThemeToggle
 * 
 * Why this is important:
 * - Primary navigation for the entire customer experience
 * - Provides easy access to key features from any page
 * - Mobile-first responsive design ensures usability on all devices
 */

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="mb-6 md:mb-8">
      {/* Desktop & Tablet Header */}
      <div className="hidden sm:flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-2xl md:text-3xl font-bold tracking-tight">
            Shop4Me
          </Link>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Lodwar&apos;s concierge shoppers — order online, pay via M-Pesa, deliver today.
          </p>
        </div>
        <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  pathname.startsWith(link.href) && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
            <CartIndicator />
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Shop4Me
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              Order online, pay via M-Pesa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CartIndicator />
            <UserMenu />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              className="ml-1"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="mt-4 pb-4 border-t pt-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block rounded-lg px-4 py-2.5 text-sm font-medium transition",
                  pathname.startsWith(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
