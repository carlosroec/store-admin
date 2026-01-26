import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;

  if (!id) {
    throw new Response("Sale ID required", { status: 400 });
  }

  try {
    const data = await api.getSaleWithLinked(token, id);
    return json({
      sale: data.sale,
      linkedSales: data.linkedSales || [],
      parentSale: data.parentSale || null
    });
  } catch (error) {
    throw new Response("Sale not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (!id) {
    return json({ error: "Sale ID required" }, { status: 400 });
  }

  try {
    switch (intent) {
      case "convert-to-pending":
        await api.convertQuoteToPending(token, id);
        break;

      case "mark-as-paid":
        const paymentMethod = formData.get("paymentMethod") as string;
        if (!paymentMethod) {
          return json({ error: "Payment method is required" }, { status: 400 });
        }
        await api.markSaleAsPaid(token, id, paymentMethod);
        break;

      case "update-status":
        const status = formData.get("status") as string;
        await api.updateSaleStatus(token, id, { status });
        break;

      case "cancel":
        await api.updateSaleStatus(token, id, { status: "cancelled" });
        break;

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }

    return redirect(`/sales/${id}`);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 }
    );
  }
}

export default function SaleDetail() {
  const { sale, linkedSales, parentSale } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyItemToClipboard = async (item: any, index: number) => {
    const text = `${item.productName} (${item.sku}) - Cant: ${item.quantity}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const statusColors: Record<string, string> = {
    quote: "bg-blue-100 text-blue-800 border-blue-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    paid: "bg-green-100 text-green-800 border-green-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    rejected: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const canEdit = sale.status === "quote";
  const canConvertToPending = sale.status === "quote";
  const canMarkAsPaid = sale.status === "pending";
  const canStartProcessing = sale.status === "paid";
  const canMarkShipped = sale.status === "processing";
  const canMarkDelivered = sale.status === "shipped";
  const canAddProducts = ["paid", "processing"].includes(sale.status);
  const canCancel = ["quote", "pending", "paid", "processing", "shipped"].includes(sale.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/sales"
              className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
            >
              &larr; Back to Sales
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">{sale.saleNumber}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/sales/${sale._id}/print`}>
              <Button variant="secondary">Print</Button>
            </Link>
            {canEdit && (
              <Link to={`/sales/${sale._id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            )}
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[sale.status]}`}
            >
              {sale.status.toUpperCase()}
            </span>
          </div>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        {/* Customer Info */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{sale.customerName}</p>
            </div>
            {sale.customerDocument && sale.customerDocument !== "Sin documento" && (
              <div>
                <p className="text-sm text-gray-600">Document</p>
                <p className="font-medium">{sale.customerDocument}</p>
              </div>
            )}
            {sale.customerId?.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{sale.customerId.phone}</p>
              </div>
            )}
            {sale.customerId?.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{sale.customerId.email}</p>
              </div>
            )}
          </div>
          {sale.customerId?.address && (sale.customerId.address.street || sale.customerId.address.district) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="font-medium">
                {[
                  sale.customerId.address.street,
                  sale.customerId.address.district,
                  sale.customerId.address.province,
                  sale.customerId.address.department
                ].filter(Boolean).join(", ")}
              </p>
              {sale.customerId.address.reference && (
                <p className="text-sm text-gray-500 mt-1">
                  Ref: {sale.customerId.address.reference}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Items ({sale.items.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Product</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">
                    Discount
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-gray-600">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyItemToClipboard(item, index)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">S/{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2">{item.discount}%</td>
                    <td className="text-right py-3 px-2 font-medium">S/{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Totals */}
        <Card className="mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>S/{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-S/{sale.discount.toFixed(2)}</span>
              </div>
            )}
            {sale.shippingCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  Shipping
                  {sale.shippingMethod && (
                    <span className="text-sm text-gray-500 ml-1">
                      ({sale.shippingMethod === "olva" ? "Olva Courier" :
                        sale.shippingMethod === "shalom" ? "Shalom" :
                        sale.shippingMethod.charAt(0).toUpperCase() + sale.shippingMethod.slice(1)})
                    </span>
                  )}
                </span>
                <span>S/{sale.shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 text-sm">
              <span>IGV (included)</span>
              <span>S/{sale.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2">
              <span>Total</span>
              <span>S/{sale.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Dates */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Quote Date</p>
              <p className="font-medium">{new Date(sale.quoteDate).toLocaleDateString()}</p>
            </div>
            {sale.quoteValidUntil && (
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="font-medium">{new Date(sale.quoteValidUntil).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{new Date(sale.createdAt).toLocaleString()}</p>
            </div>
            {sale.paymentMethod && (
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">{sale.paymentMethod}</p>
              </div>
            )}
            {sale.voucherType && (
              <div>
                <p className="text-sm text-gray-600">Voucher Type</p>
                <p className="font-medium capitalize">
                  {sale.voucherType === "sales_note" ? "Sales Note" :
                   sale.voucherType.charAt(0).toUpperCase() + sale.voucherType.slice(1)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Notes */}
        {(sale.notes || sale.internalNotes) && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            {sale.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Customer Notes</p>
                <p className="mt-1">{sale.notes}</p>
              </div>
            )}
            {sale.internalNotes && (
              <div>
                <p className="text-sm text-gray-600">Internal Notes</p>
                <p className="mt-1 text-gray-700">{sale.internalNotes}</p>
              </div>
            )}
          </Card>
        )}

        {/* Parent Sale Link */}
        {parentSale && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">This is a linked sale</p>
                <p className="font-medium">
                  Parent Sale: <Link to={`/sales/${parentSale._id}`} className="text-primary-600 hover:underline">{parentSale.saleNumber}</Link>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[parentSale.status]}`}>
                {parentSale.status.toUpperCase()}
              </span>
            </div>
          </Card>
        )}

        {/* Linked Sales */}
        {linkedSales.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Linked Sales ({linkedSales.length})</h3>
            <div className="space-y-3">
              {linkedSales.map((linked: any) => (
                <div key={linked._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Link to={`/sales/${linked._id}`} className="font-medium text-primary-600 hover:underline">
                      {linked.saleNumber}
                    </Link>
                    <p className="text-sm text-gray-600">{linked.items.length} item(s) - S/{linked.total.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[linked.status]}`}>
                    {linked.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {canConvertToPending && (
              <Form method="post">
                <input type="hidden" name="intent" value="convert-to-pending" />
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Convert to Pending Sale
                </Button>
              </Form>
            )}

            {canMarkAsPaid && (
              <Form method="post" className="flex gap-2">
                <input type="hidden" name="intent" value="mark-as-paid" />
                <select
                  name="paymentMethod"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select payment...</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="other">Other</option>
                </select>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Mark as Paid
                </Button>
              </Form>
            )}

            {canStartProcessing && (
              <Form method="post">
                <input type="hidden" name="intent" value="update-status" />
                <input type="hidden" name="status" value="processing" />
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Start Processing
                </Button>
              </Form>
            )}

            {canMarkShipped && (
              <Form method="post">
                <input type="hidden" name="intent" value="update-status" />
                <input type="hidden" name="status" value="shipped" />
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Mark as Shipped
                </Button>
              </Form>
            )}

            {canMarkDelivered && (
              <Form method="post">
                <input type="hidden" name="intent" value="update-status" />
                <input type="hidden" name="status" value="delivered" />
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Mark as Delivered
                </Button>
              </Form>
            )}

            {canAddProducts && (
              <Link to={`/sales/${sale._id}/add-products`}>
                <Button variant="secondary">
                  Add Products
                </Button>
              </Link>
            )}

            {canCancel && (
              <Form method="post">
                <input type="hidden" name="intent" value="cancel" />
                <Button type="submit" variant="danger" isLoading={isSubmitting}>
                  Cancel
                </Button>
              </Form>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
