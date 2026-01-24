import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Link, Form, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ProductForm } from "~/components/products/ProductForm";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { OptimizedImage } from "~/components/ui/OptimizedImage";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("refillSearch");

  const [productData, categoriesData, brandsData] = await Promise.all([
    api.getProduct(token, params.id!),
    api.getCategoriesAdmin(token, false),
    api.getBrandsAdmin(token, false),
  ]);

  // If searching for refills, get matching products
  let searchResults: any[] = [];
  if (searchQuery && searchQuery.length >= 2) {
    const results = await api.getProducts(token, { search: searchQuery, limit: 10 });
    // Filter out current product and already added refills
    const currentRefillIds = (productData.product.refills || []).map((r: any) => r._id);
    searchResults = results.products.filter(
      (p: any) => p._id !== params.id && !currentRefillIds.includes(p._id)
    );
  }

  return json({
    product: productData.product,
    searchResults,
    searchQuery,
    categories: categoriesData.categories,
    brands: brandsData.brands,
  });
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

  if (action === 'add-refill') {
    const refillProductId = formData.get('refillProductId') as string;
    await api.addProductRefill(token, params.id!, refillProductId);
    return redirect(`/products/${params.id}/edit`);
  }

  if (action === 'remove-refill') {
    const refillProductId = formData.get('refillProductId') as string;
    await api.removeProductRefill(token, params.id!, refillProductId);
    return redirect(`/products/${params.id}/edit`);
  }

  const images = formData.get('images') as string;
  const imageArray = images
    ? images.split('\n').map(url => url.trim()).filter(Boolean)
    : [];
  
  const productData = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    brand: formData.get('brand') as string,
    category: formData.get('category') as string,
    price: parseFloat(formData.get('price') as string),
    offerPrice: parseFloat(formData.get('offerPrice') as string) || 0,
    description: formData.get('description') as string || undefined,
    stock: parseInt(formData.get('stock') as string),
    images: imageArray,
    isTopSales: formData.get('isTopSales') === 'on',
  };
  
  // Validation
  const errors: Record<string, string> = {};
  
  if (!productData.sku) errors.sku = 'SKU is required';
  if (!productData.name) errors.name = 'Name is required';
  if (!productData.brand) errors.brand = 'Brand is required';
  if (!productData.category) errors.category = 'Category is required';
  if (isNaN(productData.price) || productData.price < 0) {
    errors.price = 'Valid price is required';
  }
  if (isNaN(productData.stock) || productData.stock < 0) {
    errors.stock = 'Valid stock is required';
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }
  
  try {
    await api.updateProduct(token, params.id!, productData);
    return redirect(`/products/${params.id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to update product' } },
      { status: 400 }
    );
  }
}

export default function EditProduct() {
  const { product, searchResults, searchQuery, categories, brands } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [refillSearch, setRefillSearch] = useState(searchQuery || "");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link
          to={`/products/${product._id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Product
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Product
        </h2>

        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}

        <Card>
          <ProductForm
            product={product}
            errors={actionData?.errors}
            categories={categories}
            brands={brands}
          />
        </Card>

        {/* Manage Refills */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Manage Refills</h3>

          {/* Search for refills */}
          <Form method="get" className="flex gap-2 mb-4">
            <input
              type="text"
              name="refillSearch"
              value={refillSearch}
              onChange={(e) => setRefillSearch(e.target.value)}
              placeholder="Search products to add as refill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </Form>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mb-4 border border-gray-200 rounded-lg divide-y">
              {searchResults.map((result: any) => (
                <div key={result._id} className="flex items-center gap-3 p-3">
                  {result.images && result.images.length > 0 ? (
                    <OptimizedImage
                      src={result.images[0]}
                      alt={result.name}
                      width={40}
                      height={40}
                      crop="fill"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span>📦</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.name}</p>
                    <p className="text-sm text-gray-500">{result.sku} - S/{result.price.toFixed(2)}</p>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="_action" value="add-refill" />
                    <input type="hidden" name="refillProductId" value={result._id} />
                    <Button type="submit" variant="primary" className="text-sm py-1 px-3">
                      Add
                    </Button>
                  </Form>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults?.length === 0 && (
            <p className="text-gray-500 text-sm mb-4">No products found matching "{searchQuery}"</p>
          )}

          {/* Current Refills */}
          {product.refills && product.refills.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Refills:</h4>
              <div className="space-y-2">
                {product.refills.map((refill: any) => (
                  <div key={refill._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {refill.images && refill.images.length > 0 ? (
                      <OptimizedImage
                        src={refill.images[0]}
                        alt={refill.name}
                        width={40}
                        height={40}
                        crop="fill"
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <span>📦</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{refill.name}</p>
                      <p className="text-sm text-gray-500">{refill.sku} - S/{refill.price.toFixed(2)}</p>
                    </div>
                    <Form method="post">
                      <input type="hidden" name="_action" value="remove-refill" />
                      <input type="hidden" name="refillProductId" value={refill._id} />
                      <Button
                        type="submit"
                        variant="danger"
                        className="text-sm py-1 px-3"
                        onClick={(e) => {
                          if (!confirm('Remove this refill?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </Form>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No refills added yet. Use the search above to find and add compatible refills.</p>
          )}
        </Card>

        {/* Product Status */}
        <Card className={`mt-6 ${product.isActive ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${product.isActive ? 'text-yellow-800' : 'text-green-800'}`}>
            Product Status
          </h3>
          <p className={`text-sm mb-4 ${product.isActive ? 'text-yellow-600' : 'text-green-600'}`}>
            {product.isActive
              ? 'This product is currently active and visible in sales searches.'
              : 'This product is disabled and will not appear in sales searches.'}
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="toggle-active" />
            <input type="hidden" name="isActive" value={product.isActive.toString()} />
            <Button
              type="submit"
              variant={product.isActive ? 'secondary' : 'primary'}
            >
              {product.isActive ? 'Disable Product' : 'Enable Product'}
            </Button>
          </Form>
        </Card>

        {/* Delete Section */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete a product, there is no going back. Please be certain.
          </p>
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
              Delete Product
            </Button>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
