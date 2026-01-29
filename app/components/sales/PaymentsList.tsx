import type { Payment } from "~/lib/api.server";

interface PaymentsSummary {
  totalPayments: number;
  totalRefunds: number;
  netPaid: number;
  saleTotal: number;
  balance: number;
}

interface PaymentsListProps {
  payments: Payment[];
  summary: PaymentsSummary;
  canAddPayment?: boolean;
  canAddRefund?: boolean;
  onAddPayment?: () => void;
  onAddRefund?: () => void;
  onDeletePayment?: (paymentId: string) => void;
  canDelete?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  transfer: 'Transfer',
  yape: 'Yape',
  plin: 'Plin',
  other: 'Other',
};

export function PaymentsList({
  payments,
  summary,
  canAddPayment = false,
  canAddRefund = false,
  onAddPayment,
  onAddRefund,
  onDeletePayment,
  canDelete = false,
}: PaymentsListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-lg font-bold">S/{summary.saleTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-lg font-bold text-green-600">S/{summary.netPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Balance</p>
          <p className={`text-lg font-bold ${summary.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            S/{summary.balance.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          {canAddPayment && summary.balance > 0 && (
            <button
              type="button"
              onClick={onAddPayment}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Payment
            </button>
          )}
          {canAddRefund && summary.netPaid > 0 && (
            <button
              type="button"
              onClick={onAddRefund}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              + Refund
            </button>
          )}
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No payments recorded yet
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                payment.type === 'refund'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  payment.type === 'refund' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {payment.type === 'refund' ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${payment.type === 'refund' ? 'text-red-800' : 'text-green-800'}`}>
                    {payment.type === 'refund' ? '-' : '+'}S/{payment.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                    {payment.reference && ` - Ref: ${payment.reference}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {payment.notes && (
                  <span className="text-xs text-gray-500 max-w-[150px] truncate" title={payment.notes}>
                    {payment.notes}
                  </span>
                )}
                {canDelete && onDeletePayment && (
                  <button
                    type="button"
                    onClick={() => onDeletePayment(payment._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete payment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar for payment completion */}
      {summary.saleTotal > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Payment Progress</span>
            <span>{Math.min(100, Math.round((summary.netPaid / summary.saleTotal) * 100))}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                summary.netPaid >= summary.saleTotal ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(100, (summary.netPaid / summary.saleTotal) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
