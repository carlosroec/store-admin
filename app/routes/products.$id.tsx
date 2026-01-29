import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { MarkdownPreview } from "~/components/ui/MarkdownEditor";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const productData = await api.getProduct(token, params.id!);

  return json({ product: productData.product });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "clone") {
    const result = await api.cloneProduct(token, params.id!);
    return redirect(`/products/${result.product._id}`);
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProductDetail() {
  const { product } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isCloning = navigation.state === "submitting" && navigation.formData?.get("intent") === "clone";

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
          <div className="flex gap-2">
            <Form method="post">
              <input type="hidden" name="intent" value="clone" />
              <Button
                type="submit"
                variant="secondary"
                isLoading={isCloning}
                disabled={isCloning}
              >
                Clone
              </Button>
            </Form>
            <Link to={`/products/${product._id}/edit`}>
              <Button variant="primary">
                Edit
              </Button>
            </Link>
          </div>
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
                  {product.offerPrice && product.offerPrice > 0 ? (
                    <dd>
                      <span className="text-2xl font-bold text-red-600">
                        S/{product.offerPrice.toFixed(2)}
                      </span>
                      <span className="ml-2 text-base text-gray-400 line-through">
                        S/{product.price.toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-red-500 font-medium">
                        (Oferta)
                      </span>
                    </dd>
                  ) : (
                    <dd className="text-2xl font-bold text-gray-900">
                      S/{product.price.toFixed(2)}
                    </dd>
                  )}
                </div>
              </dl>
            </Card>
            
            <Card>
              <h3 className="text-lg font-semibold mb-4">Inventory</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Stock</dt>
                  <dd className="text-base font-semibold text-gray-900">
                    {product.stock} units
                  </dd>
                </div>
                {(product.reservedStock > 0) && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500">Reserved</dt>
                    <dd className="text-base font-semibold text-orange-600">
                      {product.reservedStock} units
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-500">Available</dt>
                  <dd className={`text-base font-semibold ${
                    (product.stock - (product.reservedStock || 0)) > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.stock - (product.reservedStock || 0)} units
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

        {/* Characteristics */}
        {product.characteristics && product.characteristics.length > 0 && (
          <Card className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Characteristics</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {product.characteristics.map((char: { key: string; value: string }, index: number) => (
                <div key={index} className="flex">
                  <dt className="text-sm font-medium text-gray-500 min-w-[120px]">{char.key}</dt>
                  <dd className="text-sm text-gray-900">{char.value}</dd>
                </div>
              ))}
            </dl>
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
                    {refill.offerPrice && refill.offerPrice > 0 ? (
                      <>
                        <p className="font-semibold text-red-600">S/{refill.offerPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 line-through">S/{refill.price.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-gray-900">S/{refill.price.toFixed(2)}</p>
                    )}
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
