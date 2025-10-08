import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Package, 
  ShoppingBag, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isCurrentUserAdmin } from "@/lib/user-persistence";
import type { Prisma } from "@/generated/prisma";
import { OrderStatus } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Manage Orders | Admin | Shop4Me",
};

const STATUS_ICONS = {
  DRAFT: Clock,
  PENDING_PAYMENT: Clock,
  PROCESSING: Package,
  SHOPPING: ShoppingBag,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
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
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type SearchParams = {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: SearchParams) {
  // Check admin access
  const isAdmin = await isCurrentUserAdmin();
  
  if (!isAdmin) {
    redirect("/auth/signin?redirect=" + encodeURIComponent("/admin/orders"));
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const searchQuery = params.search;
  const page = parseInt(params.page || "1", 10);
  const itemsPerPage = 20;

  // Build where clause for filtering
  const whereClause: Prisma.OrderWhereInput = {};
  
  if (statusFilter && statusFilter !== "all") {
    whereClause.orderStatus = statusFilter.toUpperCase() as OrderStatus;
  }
  
  if (searchQuery) {
    whereClause.OR = [
      { id: { contains: searchQuery, mode: "insensitive" } },
      { customerName: { contains: searchQuery, mode: "insensitive" } },
      { customerPhone: { contains: searchQuery, mode: "insensitive" } },
      { mpesaReceipt: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Fetch orders with pagination
  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // Status counts for filter tabs
  const statusCounts = await prisma.order.groupBy({
    by: ["orderStatus"],
    _count: { orderStatus: true },
  });

  const statusTabs = [
    { value: "all", label: "All Orders", count: totalOrders },
    ...statusCounts.map((status) => ({
      value: status.orderStatus.toLowerCase(),
      label: formatStatus(status.orderStatus),
      count: status._count.orderStatus,
    })),
  ];

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
            <h1 className="text-3xl font-semibold tracking-tight">Manage Orders</h1>
            <p className="mt-2 text-muted-foreground">
              Review and update order status, manage deliveries
            </p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/orders?status=${tab.value}${searchQuery ? `&search=${searchQuery}` : ""}`}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted ${
              (statusFilter === tab.value || (!statusFilter && tab.value === "all"))
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/30"
            }`}
          >
            {tab.label}
            <Badge variant="secondary" className="text-xs">
              {tab.count}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name, phone, or M-Pesa receipt..."
                  defaultValue={searchQuery}
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders {statusFilter && statusFilter !== "all" ? `(${formatStatus(statusFilter)})` : ""}
          </CardTitle>
          <CardDescription>
            Showing {orders.length} of {totalOrders} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter 
                  ? "Try adjusting your search or filter criteria"
                  : "Orders will appear here when customers place them"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = STATUS_ICONS[order.orderStatus as keyof typeof STATUS_ICONS] || Clock;
                const totalAmount = order.totalEstimate?.toNumber() || 0;
                
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      <StatusIcon className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <Badge
                            variant={STATUS_COLORS[order.orderStatus as keyof typeof STATUS_COLORS] || "secondary"}
                          >
                            {formatStatus(order.orderStatus)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatStatus(order.paymentStatus)}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{order.customerName || "Guest"}</span>
                          <span>{order.customerPhone}</span>
                          <span>{order._count.items} items</span>
                          <span>{formatDate(order.createdAt)}</span>
                          {order.mpesaReceipt && (
                            <span className="font-mono">Receipt: {order.mpesaReceipt}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(totalAmount)}</p>
                        {order.landmark && (
                          <p className="text-xs text-muted-foreground">{order.landmark}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          Manage
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/admin/orders?page=${pageNum}${statusFilter ? `&status=${statusFilter}` : ""}${searchQuery ? `&search=${searchQuery}` : ""}`}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted ${
                page === pageNum
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}