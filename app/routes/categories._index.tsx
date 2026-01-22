import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get('includeInactive') === 'true';

  const data = await api.getCategoriesAdmin(token, includeInactive);

  return json({
    categories: data.categories,
    includeInactive,
  });
}

export default function CategoriesIndex() {
  const { categories, includeInactive } = useLoaderData<typeof loader>();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-600 mt-1">
            {categories.length} total
          </p>
        </div>
        <Link to="/categories/new">
          <Button variant="primary" className="w-full sm:w-auto">
            + Add Category
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Form method="get" className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="includeInactive"
              value="true"
              defaultChecked={includeInactive}
              onChange={(e) => e.target.form?.submit()}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Show inactive categories
          </label>
        </Form>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No categories found</p>
            <Link to="/categories/new">
              <Button variant="primary" className="mt-4">
                Create your first category
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any) => (
            <Link
              key={category._id}
              to={`/categories/${category._id}`}
              className="block"
            >
              <Card className={`hover:shadow-lg transition-shadow ${!category.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📁</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {category.name}
                      </h3>
                      {!category.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      /{category.slug}
                    </p>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Order: {category.order}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
