import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Link, Form } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { ExpenseForm } from "~/components/expenses/ExpenseForm";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);

  const [expenseData, categoriesData, suppliersData] = await Promise.all([
    api.getExpense(token, params.id!),
    api.getExpenseCategories(token),
    api.getExpenseSuppliers(token),
  ]);

  return json({
    expense: expenseData.expense,
    categories: categoriesData.categories,
    suppliers: suppliersData.suppliers,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  const action = formData.get('_action');

  // Handle delete action
  if (action === 'delete') {
    await api.deleteExpense(token, params.id!);
    return redirect('/expenses');
  }

  // Handle normal update
  const expenseData = {
    type: formData.get('type') as any,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    quantity: formData.get('quantity') ? parseFloat(formData.get('quantity') as string) : undefined,
    unitCost: formData.get('unitCost') ? parseFloat(formData.get('unitCost') as string) : undefined,
    supplier: formData.get('supplier') as string || undefined,
    documentType: formData.get('documentType') as any || 'none',
    documentNumber: formData.get('documentNumber') as string || undefined,
    paymentMethod: formData.get('paymentMethod') as any,
    expenseDate: formData.get('expenseDate') as string,
    notes: formData.get('notes') as string || undefined,
  };

  // Validation
  const errors: Record<string, string> = {};
  if (!expenseData.category) errors.category = 'Category is required';
  if (!expenseData.description) errors.description = 'Description is required';
  if (!expenseData.amount || expenseData.amount <= 0) errors.amount = 'Amount must be greater than 0';
  if (!expenseData.paymentMethod) errors.paymentMethod = 'Payment method is required';
  if (!expenseData.expenseDate) errors.expenseDate = 'Expense date is required';

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await api.updateExpense(token, params.id!, expenseData);
    return redirect(`/expenses/${params.id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to update expense' } },
      { status: 400 }
    );
  }
}

export default function EditExpense() {
  const { expense, categories, suppliers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to={`/expenses/${expense._id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          &larr; Back to Expense
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Expense
        </h2>

        <Card>
          <ExpenseForm
            expense={expense}
            categories={categories}
            suppliers={suppliers}
            errors={actionData?.errors}
          />
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Deleting an expense will mark it as inactive. It can still be viewed in the list with the &quot;Show deleted&quot; filter.
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="delete" />
            <Button
              type="submit"
              variant="danger"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this expense?')) {
                  e.preventDefault();
                }
              }}
            >
              Delete Expense
            </Button>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
