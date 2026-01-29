import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";

interface AddRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }) => void;
  maxAmount: number;
  isSubmitting?: boolean;
}

export function AddRefundModal({
  isOpen,
  onClose,
  onSubmit,
  maxAmount,
  isSubmitting = false,
}: AddRefundModalProps) {
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > maxAmount) {
      setError(`Refund cannot exceed total paid (S/${maxAmount.toFixed(2)})`);
      return;
    }

    if (!paymentMethod) {
      setError("Please select a refund method");
      return;
    }

    onSubmit({
      amount: amountNum,
      paymentMethod,
      paymentDate,
      reference: reference || undefined,
      notes: notes || undefined,
    });
  };

  const handleClose = () => {
    setAmount(maxAmount.toFixed(2));
    setPaymentMethod("");
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReference("");
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-700">Register Refund</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              This will record a refund and reduce the total paid amount.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="number"
                label="Refund Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                max={maxAmount}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum refundable: S/{maxAmount.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select method...</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                label="Refund Date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                type="text"
                label="Reference (optional)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction number, receipt, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason/Notes *
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Reason for refund..."
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={isSubmitting}>
                Register Refund
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
