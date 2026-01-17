import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);

  // Default to current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultStartDate = firstDayOfMonth.toISOString().split("T")[0];
  const defaultEndDate = today.toISOString().split("T")[0];

  const startDate = url.searchParams.get("startDate") || defaultStartDate;
  const endDate = url.searchParams.get("endDate") || defaultEndDate;

  const data = await api.getSalesStatistics(token, startDate, endDate);

  return json({
    statistics: data.statistics,
    startDate,
    endDate,
  });
}

export default function SalesReport() {
  const { statistics, startDate, endDate } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
    });
  };

  const statusLabels: Record<string, string> = {
    quote: "Quotes",
    pending: "Pending",
    paid: "Paid",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  const paymentLabels: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    transfer: "Transfer",
    yape: "Yape",
    plin: "Plin",
    other: "Other",
  };

  const shippingLabels: Record<string, string> = {
    pickup: "Pickup",
    delivery: "Delivery",
    olva: "Olva Courier",
    shalom: "Shalom",
    other: "Other",
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/reports"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to Reports
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Sales Report</h2>
        </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <Form method="get" className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button type="submit" variant="primary">
              Apply Filter
            </Button>
          </Form>
        </Card>

        {/* Revenue Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <p className="text-sm text-green-600 font-medium">Total Revenue</p>
            <p className="text-2xl md:text-3xl font-bold text-green-700">
              {formatCurrency(statistics.revenue.total || 0)}
            </p>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Orders</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-700">
              {statistics.revenue.count || 0}
            </p>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Average Ticket</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-700">
              {formatCurrency(statistics.revenue.averageTicket || 0)}
            </p>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">IGV Collected</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-700">
              {formatCurrency(statistics.revenue.tax || 0)}
            </p>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-xl font-semibold">
                {formatCurrency(statistics.revenue.subtotal || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discounts</p>
              <p className="text-xl font-semibold text-red-600">
                -{formatCurrency(statistics.revenue.discounts || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shipping</p>
              <p className="text-xl font-semibold">
                {formatCurrency(statistics.revenue.shipping || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IGV (included)</p>
              <p className="text-xl font-semibold">
                {formatCurrency(statistics.revenue.tax || 0)}
              </p>
            </div>
          </div>
        </Card>

        {/* Sales by Status and Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* By Status */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Sales by Status</h3>
            {statistics.byStatus.length > 0 ? (
              <div className="space-y-3">
                {statistics.byStatus.map((stat: any) => (
                  <div key={stat._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">
                        {statusLabels[stat._id] || stat._id}
                      </span>
                      <span className="text-sm text-gray-500">({stat.count})</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(stat.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </Card>

          {/* By Payment Method */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">By Payment Method</h3>
            {statistics.byPaymentMethod.length > 0 ? (
              <div className="space-y-3">
                {statistics.byPaymentMethod.map((stat: any) => (
                  <div key={stat._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">
                        {paymentLabels[stat._id] || stat._id || "Not specified"}
                      </span>
                      <span className="text-sm text-gray-500">({stat.count})</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(stat.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </Card>
        </div>

        {/* By Shipping Method */}
        {statistics.byShippingMethod.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">By Shipping Method</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statistics.byShippingMethod.map((stat: any) => (
                <div key={stat._id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    {shippingLabels[stat._id] || stat._id}
                  </p>
                  <p className="text-xl font-semibold">{stat.count}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(stat.total)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Daily Sales Trend */}
        {statistics.dailySales.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {statistics.dailySales.map((day: any) => (
                  <div
                    key={day._id}
                    className="flex flex-col items-center p-3 bg-gray-50 rounded-lg min-w-[80px]"
                  >
                    <p className="text-xs text-gray-500">{formatDate(day._id)}</p>
                    <p className="text-lg font-semibold text-primary-600">
                      {formatCurrency(day.total)}
                    </p>
                    <p className="text-xs text-gray-500">{day.count} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Top Products and Customers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top Products */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Top 10 Products</h3>
            {statistics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {statistics.topProducts.map((product: any, index: number) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.sku} - {product.totalQuantity} units
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(product.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </Card>

          {/* Top Customers */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Top 10 Customers</h3>
            {statistics.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {statistics.topCustomers.map((customer: any, index: number) => (
                  <div
                    key={customer._id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {customer.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.totalPurchases} purchases
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
