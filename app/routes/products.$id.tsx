import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link, Outlet } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { OptimizedImage } from "~/components/ui/OptimizedImage";
import { MarkdownPreview } from "~/components/ui/MarkdownEditor";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const productData = await api.getProduct(token, params.id!);
  
  return json({ product: productData.product });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'delete') {
    await api.deleteProduct(token, params.id!);
    return redirect('/products');
  }

  if (action === 'toggle-active') {
    const isActive = formData.get('isActive') === 'true';
    await api.updateProduct(token, params.id!, { isActive: !isActive });
    return redirect(`/products/${params.id}`);
  }

  return json({});
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
          <div className="flex flex-wrap gap-3">
            <Form method="post">
              <input type="hidden" name="_action" value="toggle-active" />
              <input type="hidden" name="isActive" value={product.isActive.toString()} />
              <Button
                type="submit"
                variant="secondary"
              >
                {product.isActive ? 'Disable' : 'Enable'}
              </Button>
            </Form>
            <Link to={`/products/${product._id}/edit`}>
              <Button variant="primary">
                Edit
              </Button>
            </Link>
            <Form method="post">
              <input type="hidden" name="_action" value="delete" />
              <Button
                type="submit"
                variant="danger"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to delete this product?')) {
                    e.preventDefault();
                  }
                }}
              >
                Delete
              </Button>
            </Form>
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
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">On The Way</dt>
                  <dd className="text-base text-yellow-600 font-semibold">
                    {product.onTheWay} units
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Available</dt>
                  <dd className="text-base font-bold text-gray-900">
                    {product.stock + product.onTheWay} units
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

        {/* <Outlet /> */}
      </div>
    </DashboardLayout>
  );
}
