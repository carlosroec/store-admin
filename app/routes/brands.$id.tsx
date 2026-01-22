import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const data = await api.getBrand(token, params.id!);

  return json({ brand: data.brand });
}

export default function BrandDetail() {
  const { brand } = useLoaderData<typeof loader>();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/brands"
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Brands
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {brand.name}
          </h2>
          <Link to={`/brands/${brand._id}/edit`}>
            <Button variant="primary">Edit Brand</Button>
          </Link>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-start gap-6">
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-32 h-32 object-contain rounded-lg bg-gray-50"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🏢</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-sm rounded ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600">/{brand.slug}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Display Order</p>
                <p className="font-medium">{brand.order}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {new Date(brand.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            {brand.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-700">{brand.description}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
