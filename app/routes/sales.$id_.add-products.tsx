import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher, Link } from "@remix-run/react";
import { useState } from "react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ProductSelector, type Product } from "~/components/sales/ProductSelector";
import { SaleItemsList } from "~/components/sales/SaleItemsList";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;

  if (!id) {
    throw new Response("Sale ID required", { status: 400 });
  }

  try {
    const data = await api.getSale(token, id);
    const sale = data.sale;

    // Only allow adding products to paid or processing orders
    if (!["paid", "processing"].includes(sale.status)) {
      throw new Response("Can only add products to paid or processing orders", { status: 400 });
    }

    return json({ parentSale: sale });
  } catch (error) {
    throw new Response("Sale not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;
  const formData = await request.formData();

  if (!id) {
    return json({ errors: { general: "Sale ID required" } }, { status: 400 });
  }

  const items = JSON.parse(formData.get("items") as string);
  const discount = parseFloat(formData.get("discount") as string) || 0;
  const shippingCost = parseFloat(formData.get("shippingCost") as string) || 0;
  const shippingMethod = (formData.get("shippingMethod") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;
  const internalNotes = (formData.get("internalNotes") as string) || undefined;

  const errors: Record<string, string> = {};

  if (!items || items.length === 0) {
    errors.items = "Please add at least one product";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    const result = await api.createLinkedSale(token, id, {
      items,
      discount,
      shippingCost,
      shippingMethod,
      notes,
      internalNotes,
    });

    return redirect(`/sales/${result.sale._id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : "Failed to create linked sale" } },
      { status: 400 }
    );
  }
}

export default function AddProducts() {
  const { parentSale } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const productFetcher = useFetcher<{ products: Product[] }>();

  const [items, setItems] = useState<any[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMethod, setShippingMethod] = useState("");

  const products = productFetcher.data?.products || [];
  const productsLoading = productFetcher.state === "loading";

  const handleProductSearch = (search: string) => {
    productFetcher.load(`/api/search-products?search=${encodeURIComponent(search)}`);
  };

  const handleAddProduct = (product: Product, quantity: number, discount: number) => {
    const priceAfterDiscount = product.price * (1 - discount / 100);
    const subtotal = priceAfterDiscount * quantity;

    setItems([
      ...items,
      {
        productId: product._id,
        sku: product.sku,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        discount,
        subtotal,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    const priceAfterDiscount = item.unitPrice * (1 - item.discount / 100);
    item.quantity = quantity;
    item.subtotal = priceAfterDiscount * quantity;
    setItems(updatedItems);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to={`/sales/${parentSale._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to {parentSale.saleNumber}
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Add Products to Order</h2>
          <p className="text-gray-600 mt-1">
            Adding products to <span className="font-semibold">{parentSale.saleNumber}</span> for customer{" "}
            <span className="font-semibold">{parentSale.customerName}</span>
          </p>
        </div>

        {/* Parent Sale Info */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-3">Original Order</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-medium">{parentSale.saleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{parentSale.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium capitalize">{parentSale.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Original Total</p>
              <p className="font-medium">S/{parentSale.total.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Form method="post" className="space-y-6">
          {/* Product Selection */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Add Products</h3>
            <ProductSelector
              onAdd={handleAddProduct}
              onSearch={handleProductSearch}
              products={products}
              loading={productsLoading}
            />

            <div className="mt-6">
              <SaleItemsList
                items={items}
                onRemove={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                generalDiscount={generalDiscount}
              />
            </div>

            {actionData?.errors?.items && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.items}</p>
            )}
            <input
              type="hidden"
              name="items"
              value={JSON.stringify(
                items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                }))
              )}
            />
          </Card>

          {/* Additional Options */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Additional Options</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="number"
                name="discount"
                label="General Discount (amount)"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={generalDiscount}
                onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
              />

              <Input
                type="number"
                name="shippingCost"
                label="Shipping Cost"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Method
              </label>
              <select
                name="shippingMethod"
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select method...</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
                <option value="olva">Olva Courier</option>
                <option value="shalom">Shalom</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (visible to customer)
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add any notes for the customer..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes (private)
              </label>
              <textarea
                name="internalNotes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add internal notes (not visible to customer)..."
              />
            </div>
          </Card>

          {/* Error message - near the buttons for mobile visibility */}
          {actionData?.errors?.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {actionData.errors.general}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link to={`/sales/${parentSale._id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={items.length === 0}
            >
              Create Linked Sale
            </Button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
