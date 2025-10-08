import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  CreditCard,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import { stackServerApp } from "@/lib/stack";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Admin Dashboard | Shop4Me",
};

const STATUS_ICONS = {
  DRAFT: Clock,
  PENDING_PAYMENT: Clock,
  PROCESSING: Package,
  SHOPPING: ShoppingBag,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: Clock,
} as const;

const STATUS_COLORS = {
  DRAFT: "secondary",
  PENDING_PAYMENT: "secondary", 
  PROCESSING: "default",
  SHOPPING: "default",
  OUT_FOR_DELIVERY: "default",
  DELIVERED: "secondary",
  CANCELLED: "outline",
} as const;

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminDashboardPage() {
  try {
    // Check if user is authenticated first
    const stackUser = await stackServerApp.getUser();
    
    if (!stackUser) {
      redirect("/auth/signin?redirect=" + encodeURIComponent("/admin"));
    }
    
    // Check admin access
    const isAdmin = await isCurrentUserAdmin();
    
    if (!isAdmin) {
      // If not admin, redirect to home with a message
      redirect("/?error=unauthorized");
    }
  } catch (error) {
    console.error('Error checking admin access:', error);
    redirect("/auth/signin?redirect=" + encodeURIComponent("/admin"));
  }

  // Fetch dashboard statistics
  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    deliveredOrders,
    totalRevenue,
    recentOrders,
    ordersByStatus,
  ] = await Promise.all([
    // Total orders count
    prisma.order.count(),
    
    // Pending payment orders
    prisma.order.count({
      where: {
        paymentStatus: "PENDING",
        orderStatus: "PENDING_PAYMENT",
      },
    }),
    
    // Active orders (processing, shopping, out for delivery)
    prisma.order.count({
      where: {
        orderStatus: {
          in: ["PROCESSING", "SHOPPING", "OUT_FOR_DELIVERY"],
        },
      },
    }),
    
    // Delivered orders
    prisma.order.count({
      where: { orderStatus: "DELIVERED" },
    }),
    
    // Total revenue from paid orders
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { amountCollected: true },
    }),
    
    // Recent orders (last 20)
    prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    }),
    
    // Orders by status for quick overview
    prisma.order.groupBy({
      by: ["orderStatus"],
      _count: { orderStatus: true },
      orderBy: { _count: { orderStatus: "desc" } },
    }),
  ]);

  const revenue = totalRevenue._sum.amountCollected?.toNumber() || 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Manage orders, track performance, and oversee operations
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/summary">
                <TrendingUp className="mr-2 h-4 w-4" />
                Sales Summary
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/products">
                <Package className="mr-2 h-4 w-4" />
                Manage Products
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/orders">
                <Package className="mr-2 h-4 w-4" />
                Manage Orders
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
            <p className="text-xs text-muted-foreground">Total collected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders requiring attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.slice(0, 10).map((order) => {
                  const StatusIcon = STATUS_ICONS[order.orderStatus as keyof typeof STATUS_ICONS] || Clock;
                  const totalAmount = order.totalEstimate?.toNumber() || 0;
                  
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName || "Guest"} • {order._count.items} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant={STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || "secondary"}
                        >
                          {formatStatus(order.orderStatus)}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats and Actions */}
        <div className="space-y-6">
          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordersByStatus.map((status) => (
                  <div key={status.orderStatus} className="flex items-center justify-between">
                    <span className="text-sm">{formatStatus(status.orderStatus)}</span>
                    <Badge variant="secondary">{status._count.orderStatus}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments Alert */}
          {pendingOrders > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <CreditCard className="h-5 w-5" />
                  Pending Payments
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Orders waiting for payment confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800">{pendingOrders}</div>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/admin/orders?status=pending_payment">
                    Review payments
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/orders">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Orders
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/summary">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Sales Summary
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Storefront
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
