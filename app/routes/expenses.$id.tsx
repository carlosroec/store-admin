import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api, type ExpenseType, type ExpenseDocumentType, type ExpensePaymentMethod } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  operational: 'Operational',
  inventory: 'Inventory',
  service: 'Service',
  other: 'Other',
};

const DOCUMENT_TYPE_LABELS: Record<ExpenseDocumentType, string> = {
  none: 'None',
  receipt: 'Receipt (Boleta)',
  invoice: 'Invoice (Factura)',
};

const PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  transfer: 'Transfer',
  yape: 'Yape',
  plin: 'Plin',
};

const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  operational: 'bg-blue-100 text-blue-700',
  inventory: 'bg-purple-100 text-purple-700',
  service: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const data = await api.getExpense(token, params.id!);

  return json({ expense: data.expense });
}

export default function ExpenseDetail() {
  const { expense } = useLoaderData<typeof loader>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/expenses"
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          &larr; Back to Expenses
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {expense.expenseNumber}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-sm rounded ${EXPENSE_TYPE_COLORS[expense.type as ExpenseType]}`}>
                {EXPENSE_TYPE_LABELS[expense.type as ExpenseType]}
              </span>
              <span className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                {expense.category}
              </span>
              {!expense.isActive && (
                <span className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded">
                  Deleted
                </span>
              )}
            </div>
          </div>
          {expense.isActive && (
            <Link to={`/expenses/${expense._id}/edit`}>
              <Button variant="primary">Edit Expense</Button>
            </Link>
          )}
        </div>

        <Card>
          <div className="space-y-6">
            {/* Amount */}
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(expense.amount)}
              </p>
              {expense.quantity && expense.unitCost && (
                <p className="text-sm text-gray-500 mt-2">
                  {expense.quantity} units x {formatCurrency(expense.unitCost)} each
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-900">{expense.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Expense Date</p>
                <p className="font-medium">{formatDate(expense.expenseDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{PAYMENT_METHOD_LABELS[expense.paymentMethod as ExpensePaymentMethod]}</p>
              </div>
              {expense.supplier && (
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="font-medium">{expense.supplier}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium">{DOCUMENT_TYPE_LABELS[expense.documentType as ExpenseDocumentType || 'none']}</p>
              </div>
              {expense.documentNumber && (
                <div>
                  <p className="text-sm text-gray-500">Document Number</p>
                  <p className="font-medium">{expense.documentNumber}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {expense.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t text-sm text-gray-500">
              <p>Created: {new Date(expense.createdAt).toLocaleString('es-PE')}</p>
              <p>Last updated: {new Date(expense.updatedAt).toLocaleString('es-PE')}</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
