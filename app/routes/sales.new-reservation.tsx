import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, Form, useNavigation, useFetcher } from "@remix-run/react";
import { useState } from "react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { CustomerSelector, type Customer } from "~/components/sales/CustomerSelector";
import { ProductSelector, type Product } from "~/components/sales/ProductSelector";
import { SaleItemsList } from "~/components/sales/SaleItemsList";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserToken(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();

  const customerId = formData.get("customerId") as string;
  const items = JSON.parse(formData.get("items") as string);
  const discount = parseFloat(formData.get("discount") as string) || 0;
  const shippingCost = parseFloat(formData.get("shippingCost") as string) || 0;
  const shippingMethod = (formData.get("shippingMethod") as string) || undefined;
  const voucherType = (formData.get("voucherType") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;
  const internalNotes = (formData.get("internalNotes") as string) || undefined;
  const reservationType = (formData.get("reservationType") as string) || 'standard';

  const errors: Record<string, string> = {};

  if (!customerId) {
    errors.customer = "Please select a customer";
  }

  if (!items || items.length === 0) {
    errors.items = "Please add at least one product";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    const result = await api.createReservation(token, {
      customerId,
      items,
      discount,
      shippingCost,
      shippingMethod,
      voucherType,
      notes,
      internalNotes,
      reservationType: reservationType as 'standard' | 'layaway',
    });

    return redirect(`/sales/${result.sale._id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : "Failed to create reservation" } },
      { status: 400 }
    );
  }
}

export default function NewReservation() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const customerFetcher = useFetcher<{ customers: Customer[] }>();
  const productFetcher = useFetcher<{ products: Product[] }>();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMethod, setShippingMethod] = useState("");
  const [voucherType, setVoucherType] = useState("");

  const customers = customerFetcher.data?.customers || [];
  const products = productFetcher.data?.products || [];
  const customersLoading = customerFetcher.state === "loading";
  const productsLoading = productFetcher.state === "loading";

  const handleCustomerSearch = (search: string) => {
    customerFetcher.load(`/api/search-customers?search=${encodeURIComponent(search)}`);
  };

  const handleProductSearch = (search: string) => {
    productFetcher.load(`/api/search-products?search=${encodeURIComponent(search)}`);
  };

  const handleAddProduct = (product: Product, quantity: number, discount: number) => {
    const effectivePrice = (product.offerPrice && product.offerPrice > 0) ? product.offerPrice : product.price;
    const priceAfterDiscount = effectivePrice * (1 - discount / 100);
    const subtotal = priceAfterDiscount * quantity;

    setItems([
      ...items,
      {
        productId: product._id,
        sku: product.sku,
        productName: product.name,
        quantity,
        unitPrice: effectivePrice,
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

  // Calculate totals for display
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = itemsSubtotal - generalDiscount + shippingCost;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Create New Reservation</h2>
          <p className="text-gray-600 mt-1">
            Reservations immediately reserve stock and allow partial payments
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="reservationType" value="standard" />

          {/* Customer Selection */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">1. Select Customer</h3>
            <CustomerSelector
              onSelect={setSelectedCustomer}
              onSearch={handleCustomerSearch}
              selectedCustomer={selectedCustomer}
              customers={customers}
              loading={customersLoading}
            />
            {actionData?.errors?.customer && (
              <p className="mt-2 text-sm text-red-600">{actionData.errors.customer}</p>
            )}
            <input type="hidden" name="customerId" value={selectedCustomer?._id || ""} />
          </Card>

          {/* Product Selection */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">2. Add Products</h3>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                Stock will be reserved immediately when you create this reservation.
              </p>
            </div>
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
            <h3 className="text-lg font-semibold mb-4">3. Additional Options</h3>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Type
                </label>
                <select
                  name="voucherType"
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select type...</option>
                  <option value="sales_note">Sales Note</option>
                  <option value="receipt">Receipt</option>
                  <option value="invoice">Invoice</option>
                </select>
              </div>
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

          {/* Summary */}
          {items.length > 0 && (
            <Card className="bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span>S/{itemsSubtotal.toFixed(2)}</span>
                </div>
                {generalDiscount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount</span>
                    <span>-S/{generalDiscount.toFixed(2)}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>S/{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>S/{total.toFixed(2)}</span>
                </div>
                <p className="text-sm text-orange-600 mt-2">
                  You can add payments after creating the reservation
                </p>
              </div>
            </Card>
          )}

          {/* Error message */}
          {actionData?.errors?.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {actionData.errors.general}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!selectedCustomer || items.length === 0}
            >
              Create Reservation
            </Button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
