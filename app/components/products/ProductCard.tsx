import { useState, useRef, useEffect } from "react";
import { Link, useFetcher } from "@remix-run/react";
import type { Product } from "~/lib/api.server";
import { Card } from "../ui/Card";
import { OptimizedImage } from "../ui/OptimizedImage";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isEditingStock, setIsEditingStock] = useState(false);
  const [stockValue, setStockValue] = useState(product.stock);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher();

  const reservedStock = product.reservedStock || 0;
  const availableStock = product.stock - reservedStock;
  const stockStatus = availableStock > 0 ? 'In Stock' : 'Out of Stock';
  const stockColor = availableStock > 0 ? 'text-green-600' : 'text-red-600';
  const isDisabled = product.isActive === false;
  const isUpdating = fetcher.state !== 'idle';

  // Update local state when product changes
  useEffect(() => {
    setStockValue(product.stock);
  }, [product.stock]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingStock && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingStock]);

  const handleStockSubmit = () => {
    if (stockValue !== product.stock && stockValue >= 0) {
      fetcher.submit(
        { stock: stockValue.toString() },
        { method: 'PATCH', action: `/products/${product._id}/stock` }
      );
    }
    setIsEditingStock(false);
  };

  const adjustStock = (delta: number) => {
    const newValue = Math.max(0, stockValue + delta);
    setStockValue(newValue);
    fetcher.submit(
      { stock: newValue.toString() },
      { method: 'PATCH', action: `/products/${product._id}/stock` }
    );
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow h-full ${isDisabled ? 'opacity-60' : ''}`}>
      {/* Clickable area for navigation */}
      <Link to={`/products/${product._id}`}>
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
          {isDisabled && (
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Disabled
              </span>
            </div>
          )}
          {product.images[0] ? (
            <OptimizedImage
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              crop="fill"
              className={`w-full h-full object-cover ${isDisabled ? 'grayscale' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-6xl">📦</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">COD. #00{product.sku}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {product.name}
              </h3>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>

          <div className="flex items-center justify-between mb-3">
            <div>
              {product.offerPrice && product.offerPrice > 0 ? (
                <>
                  <span className="text-2xl font-bold text-red-600">
                    S/{product.offerPrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-gray-400 line-through">
                    S/{product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  S/{product.price.toFixed(2)}
                </span>
              )}
            </div>
            <span className={`text-sm font-medium ${stockColor}`}>
              {stockStatus}
            </span>
          </div>
        </div>
      </Link>

      {/* Stock editing - outside the Link */}
      <div
        className="mt-2 pt-3 border-t border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Stock:</span>
            {reservedStock > 0 && (
              <span className="text-xs text-orange-600 ml-1">
                ({reservedStock} reserved)
              </span>
            )}
          </div>

          {isEditingStock ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                onBlur={handleStockSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStockSubmit();
                  if (e.key === 'Escape') {
                    setStockValue(product.stock);
                    setIsEditingStock(false);
                  }
                }}
                className="w-16 px-2 py-1 text-center border border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Decrease button */}
              <button
                type="button"
                onClick={() => adjustStock(-1)}
                disabled={isUpdating || stockValue <= 0}
                className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-lg font-bold transition-colors active:bg-gray-300"
              >
                -
              </button>

              {/* Stock value - tap to edit */}
              <button
                type="button"
                onClick={() => setIsEditingStock(true)}
                className={`min-w-[3rem] px-2 py-1 text-center font-semibold rounded-lg transition-colors ${
                  isUpdating
                    ? 'bg-gray-100 text-gray-400'
                    : reservedStock > 0
                    ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 active:bg-orange-200'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200'
                }`}
                title={reservedStock > 0 ? `${availableStock} available (${reservedStock} reserved)` : undefined}
              >
                {isUpdating ? '...' : stockValue}
              </button>

              {/* Increase button */}
              <button
                type="button"
                onClick={() => adjustStock(1)}
                disabled={isUpdating}
                className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-lg font-bold transition-colors active:bg-gray-300"
              >
                +
              </button>
            </div>
          )}
        </div>

        <div className="mt-2">
          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
            {product.category}
          </span>
        </div>
      </div>
    </Card>
  );
}
