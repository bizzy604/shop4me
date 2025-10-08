/**
 * Admin Footer Component
 * 
 * Purpose:
 * - Provides a minimal footer for admin pages
 * - Shows copyright and version information
 * - Maintains clean admin interface
 * 
 * Dependencies:
 * - Used in: /app/admin/layout.tsx
 * 
 * Why this is important:
 * - Completes the admin layout with footer information
 * - Provides copyright and system information
 * - Maintains professional admin dashboard appearance
 */

export function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex flex-col gap-2 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Shop4Me Admin Portal. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Version 1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
