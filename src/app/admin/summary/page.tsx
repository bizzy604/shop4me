import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Sales Summary | Admin | Shop4Me",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function AdminSummaryPage() {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent("/admin/summary"));
  }

  // Date ranges for analysis
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch comprehensive statistics
  const [
    totalStats,
    todayStats,
    weekStats,
    monthStats,
    lastMonthStats,
    recentDelivered,
    topProducts,
    dailyRevenue,
  ] = await Promise.all([
    // All-time statistics
    Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: "DELIVERED" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { amountCollected: true },
      }),
      prisma.expense.aggregate({
        _sum: { cost: true, deliveryFee: true },
      }),
    ]),

    // Today's statistics
    Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({
        where: { 
          paymentStatus: "PAID",
          createdAt: { gte: startOfToday }
        },
        _sum: { amountCollected: true },
      }),
    ]),

    // This week's statistics
    Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfThisWeek } } }),
      prisma.order.aggregate({
        where: { 
          paymentStatus: "PAID",
          createdAt: { gte: startOfThisWeek }
        },
        _sum: { amountCollected: true },
      }),
    ]),

    // This month's statistics
    Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.order.aggregate({
        where: { 
          paymentStatus: "PAID",
          createdAt: { gte: startOfThisMonth }
        },
        _sum: { amountCollected: true },
      }),
    ]),

    // Last month's statistics
    Promise.all([
      prisma.order.count({ 
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          } 
        } 
      }),
      prisma.order.aggregate({
        where: { 
          paymentStatus: "PAID",
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          }
        },
        _sum: { amountCollected: true },
      }),
    ]),

    // Recent delivered orders
    prisma.order.findMany({
      where: { orderStatus: "DELIVERED" },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    }),

    // Top products by order frequency
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
        order: { orderStatus: "DELIVERED" },
      },
      _count: { productId: true },
      _sum: { quantity: true },
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }).then(async (items) => {
      const productIds = items.map(item => item.productId).filter(Boolean) as string[];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      
      return items.map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId),
      }));
    }),

    // Daily revenue for the last 30 days
    prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(COALESCE(amount_collected, 0)) as revenue
      FROM orders 
      WHERE 
        payment_status = 'PAID' 
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    ` as Promise<Array<{
      date: Date;
      order_count: bigint;
      revenue: number;
    }>>,
  ]);

  const [totalOrders, deliveredOrders, totalRevenueData, totalExpensesData] = totalStats;
  const [todayOrders, todayRevenueData] = todayStats;
  const [weekOrders, weekRevenueData] = weekStats;
  const [monthOrders, monthRevenueData] = monthStats;
  const [lastMonthOrders, lastMonthRevenueData] = lastMonthStats;

  const totalRevenue = totalRevenueData._sum.amountCollected?.toNumber() || 0;
  const totalExpenses = (totalExpensesData._sum.cost?.toNumber() || 0) + 
                       (totalExpensesData._sum.deliveryFee?.toNumber() || 0);
  const totalProfit = totalRevenue - totalExpenses;

  const todayRevenue = todayRevenueData._sum.amountCollected?.toNumber() || 0;
  const weekRevenue = weekRevenueData._sum.amountCollected?.toNumber() || 0;
  const monthRevenue = monthRevenueData._sum.amountCollected?.toNumber() || 0;
  const lastMonthRevenue = lastMonthRevenueData._sum.amountCollected?.toNumber() || 0;

  const monthGrowth = lastMonthRevenue > 0 
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
    : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Sales Summary</h1>
            <p className="mt-2 text-muted-foreground">
              Financial overview and business performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">
              of {totalOrders} total orders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthGrowth >= 0 ? '+' : ''}{monthGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Revenue Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Performance across different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Today</p>
                    <p className="text-sm text-muted-foreground">{todayOrders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(todayRevenue)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">This Week</p>
                    <p className="text-sm text-muted-foreground">{weekOrders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(weekRevenue)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-sm text-muted-foreground">{monthOrders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(monthRevenue)}</p>
                    <p className={`text-sm ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthGrowth >= 0 ? '+' : ''}{monthGrowth.toFixed(1)}% vs last month
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Delivered Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>Latest completed orders</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDelivered.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No delivered orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentDelivered.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName || "Guest"} • {order._count.items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(order.amountCollected?.toNumber() || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Products</CardTitle>
              <CardDescription>Most ordered items</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No product data yet</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 5).map((item, index) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {item.product?.name || "Unknown Product"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item._count.productId} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {item._sum.quantity || 0} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Revenue</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Expenses</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Net Profit</span>
                <span className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(totalProfit)}
                </span>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Profit margin: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}