import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import StackAuthProvider from "@/components/stack-provider";
import { CartProvider } from "@/components/cart-provider";
import { TooltipProvider } from "@stackframe/stack-ui";
import { Header } from "@/components/header";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${poppins.variable} font-sans antialiased`}
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
                <div className="min-h-screen p-6 pb-16 sm:p-10">
                  <Header />
                  <main className="mx-auto w-full max-w-6xl">
                    {children}
                  </main>
                </div>
              </ThemeProvider>
            </TooltipProvider>
          </CartProvider>
        </StackAuthProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
