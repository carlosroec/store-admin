import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { ExpenseForm } from "~/components/expenses/ExpenseForm";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);

  const [categoriesData, suppliersData] = await Promise.all([
    api.getExpenseCategories(token),
    api.getExpenseSuppliers(token),
  ]);

  return json({
    categories: categoriesData.categories,
    suppliers: suppliersData.suppliers,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();

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
    await api.createExpense(token, expenseData);
    return redirect('/expenses');
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to create expense' } },
      { status: 400 }
    );
  }
}

export default function NewExpense() {
  const { categories, suppliers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/expenses"
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          &larr; Back to Expenses
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          New Expense
        </h2>

        <Card>
          <ExpenseForm
            categories={categories}
            suppliers={suppliers}
            errors={actionData?.errors}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
