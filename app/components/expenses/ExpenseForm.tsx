import { Form, useNavigation } from "@remix-run/react";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import type { Expense, ExpenseType, ExpenseDocumentType, ExpensePaymentMethod } from "~/lib/api.server";

interface ExpenseFormProps {
  expense?: Expense;
  categories: string[];
  suppliers: string[];
  errors?: Record<string, string>;
}

const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'operational', label: 'Operational' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
];

const DOCUMENT_TYPES: { value: ExpenseDocumentType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'receipt', label: 'Receipt (Boleta)' },
  { value: 'invoice', label: 'Invoice (Factura)' },
];

const PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
];

export function ExpenseForm({ expense, categories, suppliers, errors }: ExpenseFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Format date for input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <Form method="post" className="space-y-6">
      {errors?.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errors.general}
        </div>
      )}

      {/* Type and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="type"
            name="type"
            defaultValue={expense?.type || 'operational'}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {EXPENSE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors?.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <input
            type="text"
            id="category"
            name="category"
            list="category-list"
            defaultValue={expense?.category}
            required
            placeholder="e.g., Boxes, Labels, Shipping"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <datalist id="category-list">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {errors?.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={expense?.description}
          required
          rows={2}
          placeholder="Describe the expense..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {errors?.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Amount, Quantity, Unit Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          type="number"
          name="amount"
          label="Total Amount *"
          defaultValue={expense?.amount}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors?.amount}
        />

        <Input
          type="number"
          name="quantity"
          label="Quantity"
          defaultValue={expense?.quantity}
          min="0"
          step="1"
          placeholder="Optional"
          error={errors?.quantity}
        />

        <Input
          type="number"
          name="unitCost"
          label="Unit Cost"
          defaultValue={expense?.unitCost}
          min="0"
          step="0.01"
          placeholder="Optional"
          error={errors?.unitCost}
        />
      </div>

      {/* Date and Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="date"
          name="expenseDate"
          label="Expense Date *"
          defaultValue={formatDateForInput(expense?.expenseDate)}
          required
          error={errors?.expenseDate}
        />

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method *
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={expense?.paymentMethod || 'cash'}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors?.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>}
        </div>
      </div>

      {/* Supplier */}
      <div>
        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
          Supplier
        </label>
        <input
          type="text"
          id="supplier"
          name="supplier"
          list="supplier-list"
          defaultValue={expense?.supplier}
          placeholder="Optional - e.g., Provider name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <datalist id="supplier-list">
          {suppliers.map((sup) => (
            <option key={sup} value={sup} />
          ))}
        </datalist>
        {errors?.supplier && <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>}
      </div>

      {/* Document Type and Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
            Document Type
          </label>
          <select
            id="documentType"
            name="documentType"
            defaultValue={expense?.documentType || 'none'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          type="text"
          name="documentNumber"
          label="Document Number"
          defaultValue={expense?.documentNumber}
          placeholder="Optional - e.g., 001-0001234"
          error={errors?.documentNumber}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={expense?.notes}
          rows={3}
          placeholder="Optional - Additional notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {expense ? 'Update Expense' : 'Create Expense'}
        </Button>
      </div>
    </Form>
  );
}
