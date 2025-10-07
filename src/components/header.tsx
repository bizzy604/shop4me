'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { CartIndicator } from "@/components/cart/indicator";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/orders", label: "My Orders" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
      <div>
        <Link href="/" className="text-3xl font-bold tracking-tight">
          Shop4Me
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
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
                "rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground",
                pathname.startsWith(link.href) && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <CartIndicator />
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
