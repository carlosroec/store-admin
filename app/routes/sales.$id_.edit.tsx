import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, useFetcher, Link } from "@remix-run/react";
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

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;

  if (!id) {
    throw new Response("Sale ID required", { status: 400 });
  }

  try {
    const data = await api.getSale(token, id);
    const sale = data.sale;

    // Only quotes can be edited
    if (sale.status !== "quote") {
      throw new Response("Only quotes can be edited", { status: 403 });
    }

    return json({ sale });
  } catch (error) {
    if (error instanceof Response) throw error;
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

  const customerId = formData.get("customerId") as string;
  const items = JSON.parse(formData.get("items") as string);
  const discount = parseFloat(formData.get("discount") as string) || 0;
  const shippingCost = parseFloat(formData.get("shippingCost") as string) || 0;
  const shippingMethod = (formData.get("shippingMethod") as string) || undefined;
  const quoteValidDays = parseInt(formData.get("quoteValidDays") as string) || 7;
  const notes = (formData.get("notes") as string) || undefined;
  const internalNotes = (formData.get("internalNotes") as string) || undefined;

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
    await api.updateSale(token, id, {
      customerId,
      items,
      discount,
      shippingCost,
      shippingMethod,
      quoteValidDays,
      notes,
      internalNotes,
    });

    return redirect(`/sales/${id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : "Failed to update quote" } },
      { status: 400 }
    );
  }
}

export default function EditSale() {
  const { sale } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const customerFetcher = useFetcher<{ customers: Customer[] }>();
  const productFetcher = useFetcher<{ products: Product[] }>();

  // Initialize state with existing sale data
  // customerId can be a populated object or a string depending on the API response
  const customerId = typeof sale.customerId === 'object'
    ? (sale.customerId as any)._id
    : sale.customerId;

  // Parse document info only if it contains the ":" separator
  const hasDocument = sale.customerDocument && sale.customerDocument.includes(":");
  const documentType = hasDocument ? sale.customerDocument.split(":")[0] : undefined;
  const documentNumber = hasDocument ? sale.customerDocument.split(":")[1]?.trim() : undefined;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>({
    _id: customerId,
    fullName: sale.customerName,
    documentType,
    documentNumber,
  });

  const [items, setItems] = useState<any[]>(
    sale.items.map((item: any) => ({
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      subtotal: item.subtotal,
    }))
  );

  const [generalDiscount, setGeneralDiscount] = useState(sale.discount || 0);
  const [shippingCost, setShippingCost] = useState(sale.shippingCost || 0);
  const [shippingMethod, setShippingMethod] = useState(sale.shippingMethod || "");
  const [quoteValidDays, setQuoteValidDays] = useState(7);
  const [notes, setNotes] = useState(sale.notes || "");
  const [internalNotes, setInternalNotes] = useState(sale.internalNotes || "");

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
            to={`/sales/${sale._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to Sale Details
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Edit Quote: {sale.saleNumber}</h2>
        </div>

        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}

        <Form method="post" className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">1. Customer</h3>
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
            <h3 className="text-lg font-semibold mb-4">2. Products</h3>
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
                name="quoteValidDays"
                label="Extend Quote (days from today)"
                min="1"
                value={quoteValidDays}
                onChange={(e) => setQuoteValidDays(parseInt(e.target.value) || 7)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (visible to customer)
              </label>
              <textarea
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add internal notes (not visible to customer)..."
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link to={`/sales/${sale._id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!selectedCustomer || items.length === 0}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
