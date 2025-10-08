import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import StackAuthProvider from "@/components/stack-provider";
import { CartProvider } from "@/components/cart-provider";
import { TooltipProvider } from "@stackframe/stack-ui";
import { ConditionalHeader, CustomerPageWrapper, ConditionalFooter } from "@/components/conditional-header";
import { Toaster } from "@/components/ui/sonner";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Shop4Me - Your Local Shopping Assistant",
  description: "Order products online, pay via M-Pesa, and get them delivered to your doorstep in Lodwar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${dmSans.variable} ${spaceMono.variable} font-sans antialiased flex flex-col min-h-screen`}
      ><StackProvider app={stackClientApp}><StackTheme>
        <StackAuthProvider>
          <CartProvider>
            <TooltipProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <ConditionalHeader />
                <CustomerPageWrapper>
                  {children}
                </CustomerPageWrapper>
                <ConditionalFooter />
                <Toaster />
              </ThemeProvider>
            </TooltipProvider>
          </CartProvider>
        </StackAuthProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
