import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Link, Form } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ProductForm } from "~/components/products/ProductForm";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

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
    description: formData.get('description') as string || undefined,
    stock: parseInt(formData.get('stock') as string),
    onTheWay: parseInt(formData.get('onTheWay') as string) || 0,
    images: imageArray,
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
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
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
          <ProductForm product={product} errors={actionData?.errors} />
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
