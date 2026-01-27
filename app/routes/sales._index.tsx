import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);

  const search = url.searchParams.get("search") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");

  const salesData = await api.getSales(token, {
    search,
    status,
    page,
    limit: 20
  });

  return json({
    sales: salesData.sales,
    pagination: salesData.pagination,
    filters: { search, status },
  });
}

export default function SalesIndex() {
  const { sales, pagination, filters } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";

  const statusColors: Record<string, string> = {
    quote: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-800',
  };

  const statuses = [
    { value: "", label: "All Statuses" },
    { value: "quote", label: "Quote" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales & Quotes</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} total
          </p>
        </div>
        <Link to="/sales/new">
          <Button variant="primary" className="w-full sm:w-auto">
            + New Quote
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Form method="get" className="space-y-4 md:space-y-0 md:flex md:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              name="search"
              placeholder="Search by sale number or customer..."
              defaultValue={filters.search || ""}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              name="status"
              defaultValue={filters.status || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" isLoading={isSearching} className="flex-1 md:flex-none">
              Search
            </Button>
            {(filters.search || filters.status) && (
              <Link to="/sales" className="flex-1 md:flex-none">
                <Button type="button" variant="secondary" className="w-full">
                  Clear
                </Button>
              </Link>
            )}
          </div>
        </Form>
      </Card>

      {/* Sales List */}
      {sales.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            {filters.search || filters.status ? (
              <>
                <p className="text-gray-500 text-lg">No sales found matching your search</p>
                <Link to="/sales">
                  <Button variant="secondary" className="mt-4">
                    Clear filters
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No sales or quotes yet</p>
                <Link to="/sales/new">
                  <Button variant="primary" className="mt-4">
                    Create your first quote
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sales.map((sale: any) => (
            <Card key={sale._id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {sale.saleNumber}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[sale.status]}`}>
                      {sale.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Customer:</span> {sale.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(sale.quoteDate).toLocaleDateString()}
                    </p>
                    {sale.shippingMethod && (
                      <p className="hidden sm:block">
                        <span className="font-medium">Shipping:</span>{' '}
                        {sale.shippingMethod === 'olva' ? 'Olva Courier' :
                         sale.shippingMethod === 'shalom' ? 'Shalom' :
                         sale.shippingMethod.charAt(0).toUpperCase() + sale.shippingMethod.slice(1)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Items:</span> {sale.items.length}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="sm:text-right">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      S/{sale.total.toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Subtotal: S/{sale.subtotal.toFixed(2)}
                    </p>
                  </div>

                  <Link to={`/sales/${sale._id}`}>
                    <Button variant="primary" className="whitespace-nowrap">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
              {pagination.page > 1 && (
                <Link
                  to={`/sales?${new URLSearchParams({
                    ...(filters.search && { search: filters.search }),
                    ...(filters.status && { status: filters.status }),
                    page: String(pagination.page - 1),
                  })}`}
                >
                  <Button variant="secondary" className="text-sm">Previous</Button>
                </Link>
              )}
              <span className="px-3 py-2 text-sm text-gray-600">
                {pagination.page} / {pagination.pages}
              </span>
              {pagination.page < pagination.pages && (
                <Link
                  to={`/sales?${new URLSearchParams({
                    ...(filters.search && { search: filters.search }),
                    ...(filters.status && { status: filters.status }),
                    page: String(pagination.page + 1),
                  })}`}
                >
                  <Button variant="secondary" className="text-sm">Next</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
