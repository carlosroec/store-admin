import { Button } from "../ui/Button";

interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface SaleItemsListProps {
  items: SaleItem[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  generalDiscount: number;
}

export function SaleItemsList({ items, onRemove, onUpdateQuantity, generalDiscount }: SaleItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No items added yet</p>
        <p className="text-sm text-gray-400 mt-1">Search and add products above</p>
      </div>
    );
  }
  
  // All prices already include IGV
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - generalDiscount;
  // Extract IGV for display (informational only)
  const tax = total - (total / 1.18);
  
  return (
    <div className="space-y-4">
      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Qty</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Disc %</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Subtotal</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{item.productName}</div>
                  <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  ${item.unitPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.discount}%
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  ${item.subtotal.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        
        {generalDiscount > 0 && (
          <div className="flex items-center justify-between text-gray-700">
            <span>Discount</span>
            <span className="font-semibold text-red-600">-${generalDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-gray-500 text-sm">
          <span>IGV (included)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-300 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-primary-600">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
