import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { MarkdownPreview } from "~/components/ui/MarkdownEditor";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const productData = await api.getProduct(token, params.id!);
  
  return json({ product: productData.product });
}

export default function ProductDetail() {
  const { product } = useLoaderData<typeof loader>();
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
            >
              ← Back to Products
            </Link>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">
                {product.name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
          </div>
          <Link to={`/products/${product._id}/edit`}>
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Edit
            </span>
          </Link>
        </div>
        
        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Images</h3>
            {product.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {product.images.map((image: string, index: number) => (
                  <OptimizedImage
                    key={index}
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    width={400}
                    height={400}
                    crop="fill"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </Card>
          
          {/* Details */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Brand</dt>
                  <dd className="text-base text-gray-900">{product.brand}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-base text-gray-900">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </Card>
            
            <Card>
              <h3 className="text-lg font-semibold mb-4">Inventory</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">Stock</dt>
                  <dd className={`text-base font-semibold ${
                    product.stock > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.stock} units
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
        
        {/* Description */}
        {product.description && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <MarkdownPreview content={product.description} className="text-gray-700" />
          </Card>
        )}

        {/* Compatible Refills */}
        {product.refills && product.refills.length > 0 && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Compatible Refills</h3>
            <div className="space-y-3">
              {product.refills.map((refill: any) => (
                <Link
                  key={refill._id}
                  to={`/products/${refill._id}`}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {refill.images && refill.images.length > 0 ? (
                    <OptimizedImage
                      src={refill.images[0]}
                      alt={refill.name}
                      width={60}
                      height={60}
                      crop="fill"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xl">📦</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{refill.name}</p>
                    <p className="text-sm text-gray-500">SKU: {refill.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${refill.price.toFixed(2)}</p>
                    {!refill.isActive && (
                      <span className="text-xs text-red-600">Disabled</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
