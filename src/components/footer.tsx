import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

/**
 * Footer Component
 * 
 * Purpose:
 * - Provides site-wide footer with important links and information
 * - Displays contact information and social media links
 * - Shows copyright and company information
 * - Includes navigation links for quick access
 * 
 * Dependencies:
 * - Used in: /app/layout.tsx (customer pages)
 * - Links to: Various pages (products, orders, about, contact)
 * 
 * Why this is important:
 * - Improves site navigation and user experience
 * - Provides essential contact and company information
 * - Enhances SEO with structured footer links
 * - Creates a professional and complete website feel
 */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Shop4Me</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted local shopping assistant in Lodwar. Order online, pay via M-Pesa, and get same-day delivery.
            </p>
            <div className="flex gap-4">
              <Link 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-muted-foreground hover:text-primary transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Lodwar Town<br />
                  Turkana County, Kenya
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a 
                  href="tel:+254700000000" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  +254 725 138 940
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a 
                  href="mailto:support@shop4me.co.ke" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  support@shop4me.co.ke
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <div className="flex flex-col gap-2 sm:gap-4 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">
              &copy; {currentYear} Shop4Me. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Made with love by Amoni Kevin
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
