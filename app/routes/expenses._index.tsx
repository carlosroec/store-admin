import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form, useSearchParams } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api, type Expense, type ExpenseType, type ExpensePaymentMethod, type ExpenseFilters } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  operational: 'Operational',
  inventory: 'Inventory',
  service: 'Service',
  other: 'Other',
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

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);

  const filters: ExpenseFilters = {
    type: (url.searchParams.get('type') as ExpenseType) || undefined,
    category: url.searchParams.get('category') || undefined,
    startDate: url.searchParams.get('startDate') || undefined,
    endDate: url.searchParams.get('endDate') || undefined,
    search: url.searchParams.get('search') || undefined,
    paymentMethod: (url.searchParams.get('paymentMethod') as ExpensePaymentMethod) || undefined,
    page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1,
    limit: 20,
    includeInactive: url.searchParams.get('includeInactive') === 'true',
  };

  const [expensesData, categoriesData] = await Promise.all([
    api.getExpenses(token, filters),
    api.getExpenseCategories(token),
  ]);

  return json({
    expenses: expensesData.expenses,
    pagination: expensesData.pagination,
    categories: categoriesData.categories,
    filters,
  });
}

export default function ExpensesIndex() {
  const { expenses, pagination, categories, filters } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  // Calculate total for current page
  const totalAmount = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} total expenses
          </p>
        </div>
        <Link to="/expenses/new">
          <Button variant="primary" className="w-full sm:w-auto">
            + New Expense
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Form method="get" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search expenses..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue={filters.type}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All types</option>
                {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={filters.category}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All categories</option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue={filters.paymentMethod}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All methods</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                defaultValue={filters.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={filters.endDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Include Inactive */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
                <input
                  type="checkbox"
                  name="includeInactive"
                  value="true"
                  defaultChecked={filters.includeInactive}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Show deleted
              </label>
            </div>

            {/* Submit */}
            <div className="flex items-end gap-2">
              <Button type="submit" variant="primary" className="flex-1">
                Filter
              </Button>
              <Link to="/expenses">
                <Button type="button" variant="secondary">
                  Clear
                </Button>
              </Link>
            </div>
          </div>
        </Form>
      </Card>

      {/* Summary */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg">
        <p className="text-sm text-primary-700">
          Total on this page: <span className="font-bold">{formatCurrency(totalAmount)}</span>
        </p>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No expenses found</p>
            <Link to="/expenses/new">
              <Button variant="primary" className="mt-4">
                Create your first expense
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense: Expense) => (
            <Link
              key={expense._id}
              to={`/expenses/${expense._id}`}
              className="block"
            >
              <Card className={`hover:shadow-lg transition-shadow ${!expense.isActive ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-gray-500">
                        {expense.expenseNumber}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${EXPENSE_TYPE_COLORS[expense.type]}`}>
                        {EXPENSE_TYPE_LABELS[expense.type]}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {expense.category}
                      </span>
                      {!expense.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                          Deleted
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {expense.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      <span>{formatDate(expense.expenseDate)}</span>
                      <span>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</span>
                      {expense.supplier && (
                        <span>Supplier: {expense.supplier}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    {expense.quantity && expense.unitCost && (
                      <p className="text-sm text-gray-500">
                        {expense.quantity} x {formatCurrency(expense.unitCost)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {pagination.page > 1 && (
            <Link
              to={`/expenses?${new URLSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(pagination.page - 1),
              })}`}
            >
              <Button variant="secondary">Previous</Button>
            </Link>
          )}
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          {pagination.page < pagination.pages && (
            <Link
              to={`/expenses?${new URLSearchParams({
                ...Object.fromEntries(searchParams),
                page: String(pagination.page + 1),
              })}`}
            >
              <Button variant="secondary">Next</Button>
            </Link>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
