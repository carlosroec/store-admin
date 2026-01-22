import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const data = await api.getCategory(token, params.id!);

  return json({ category: data.category });
}

export default function CategoryDetail() {
  const { category } = useLoaderData<typeof loader>();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/categories"
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Categories
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {category.name}
          </h2>
          <Link to={`/categories/${category._id}/edit`}>
            <Button variant="primary">Edit Category</Button>
          </Link>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Image */}
            <div className="flex items-start gap-6">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📁</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-sm rounded ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600">/{category.slug}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Display Order</p>
                <p className="font-medium">{category.order}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(category.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            {category.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-700">{category.description}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
