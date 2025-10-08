'use client';

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReactNode } from "react";

/**
 * Conditional Header Component
 * 
 * Purpose:
 * - Shows the customer header only on non-admin pages
 * - Hides the header on admin pages (which use the sidebar instead)
 * - Provides proper layout spacing for customer pages
 * 
 * Dependencies:
 * - Used in: /app/layout.tsx (root layout)
 * - Components: Header component
 * 
 * Why this is important:
 * - Prevents duplicate navigation on admin pages
 * - Ensures clean separation between admin and customer UI
 * - Maintains proper layout structure for both user types
 */

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on admin pages
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return null;
  }
  
  return (
    <div className="p-6 pb-4 sm:p-10 sm:pb-4">
      <div className="mx-auto w-full max-w-6xl">
        <Header />
      </div>
    </div>
  );
}

/**
 * Conditional Footer Component
 * 
 * Purpose:
 * - Shows the customer footer only on non-admin pages
 * - Hides the footer on admin pages (which use their own footer)
 */

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return null;
  }
  
  return <Footer />;
}

/**
 * Customer Page Wrapper Component
 * 
 * Purpose:
 * - Wraps customer-facing pages with proper layout container
 * - Provides consistent spacing and max-width for content
 * - Only applied to non-admin pages
 */

export function CustomerPageWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  return (
    <div className="p-6 pt-0 pb-16 sm:p-10 sm:pt-0 flex-1">
      <div className="mx-auto w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
}
