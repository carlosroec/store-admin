import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useSearchParams } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);

  const filters = {
    search: url.searchParams.get("search") || undefined,
    socialMediaSource: url.searchParams.get("socialMediaSource") || undefined,
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: 20,
  };

  const data = await api.getCustomers(token, filters);

  return json({
    customers: data.customers,
    pagination: data.pagination,
  });
}

export default function CustomersIndex() {
  const { customers, pagination } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const socialMediaSources = [
    { value: "", label: "All Sources" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "tiktok", label: "TikTok" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "other", label: "Other" },
  ];

  // Build URL with filters for pagination
  const buildPaginationUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} total
          </p>
        </div>
        <Link to="/customers/new">
          <Button variant="primary" className="w-full sm:w-auto">+ Add Customer</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Form method="get" className="space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-end">
          <div className="flex-1 md:min-w-[200px]">
            <Input
              type="text"
              name="search"
              label="Search"
              placeholder="Search by name or document..."
              defaultValue={searchParams.get("search") || ""}
            />
          </div>

          <div className="md:min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Social Media Source
            </label>
            <select
              name="socialMediaSource"
              defaultValue={searchParams.get("socialMediaSource") || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {socialMediaSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="flex-1 md:flex-none">
              Search
            </Button>
            <Link to="/customers" className="flex-1 md:flex-none">
              <Button type="button" variant="secondary" className="w-full">
                Clear
              </Button>
            </Link>
          </div>
        </Form>
      </Card>

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No customers found</p>
          <Link to="/customers/new">
            <Button variant="primary" className="mt-4">
              Create your first customer
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-4">
            {customers.map((customer: any) => (
              <Card key={customer._id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      to={`/customers/${customer._id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {customer.fullName}
                    </Link>
                    {customer.socialMedia?.source && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {customer.socialMedia.source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.documentType && customer.documentNumber && (
                    <div className="flex items-center gap-2">
                      <span>🪪</span>
                      <span>{customer.documentType}: {customer.documentNumber}</span>
                    </div>
                  )}
                  {customer.socialMedia?.username && (
                    <div className="flex items-center gap-2">
                      <span>@</span>
                      <span>{customer.socialMedia.username}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link to={`/customers/${customer._id}`}>
                      <Button variant="secondary" className="text-sm py-1 px-3">
                        View
                      </Button>
                    </Link>
                    <Link to={`/customers/${customer._id}/edit`}>
                      <Button variant="secondary" className="text-sm py-1 px-3">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Document
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer: any) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        to={`/customers/${customer._id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {customer.fullName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {customer.documentType && customer.documentNumber
                        ? `${customer.documentType}: ${customer.documentNumber}`
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>
                        {customer.phone && <div>{customer.phone}</div>}
                        {customer.email && (
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        )}
                        {!customer.phone && !customer.email && "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {customer.socialMedia?.source && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {customer.socialMedia.source}
                        </span>
                      )}
                      {customer.socialMedia?.username && (
                        <div className="text-sm text-gray-500 mt-1">
                          @{customer.socialMedia.username}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/customers/${customer._id}`}>
                          <Button variant="secondary" className="text-sm py-1 px-3">
                            View
                          </Button>
                        </Link>
                        <Link to={`/customers/${customer._id}/edit`}>
                          <Button variant="secondary" className="text-sm py-1 px-3">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  to={buildPaginationUrl(page)}
                  className={`
                    px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm
                    ${
                      page === pagination.page
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {page}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
