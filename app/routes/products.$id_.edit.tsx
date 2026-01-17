import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ProductForm } from "~/components/products/ProductForm";
import { Card } from "~/components/ui/Card";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const productData = await api.getProduct(token, params.id!);
  
  return json({ product: productData.product });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  
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
          Edit Product 1
        </h2>
        
        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}
        
        <Card>
          <ProductForm product={product} errors={actionData?.errors} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
