import { useState, useEffect, useRef } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export interface Product {
  _id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

interface ProductSelectorProps {
  onAdd: (product: Product, quantity: number, discount: number) => void;
  onSearch: (search: string) => void;
  products: Product[];
  loading?: boolean;
}

export function ProductSelector({
  onAdd,
  onSearch,
  products,
  loading = false
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  // Ref para mantener referencia estable a onSearch
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (search.length < 2) {
      return;
    }

    const debounce = setTimeout(() => {
      onSearchRef.current(search);
      setShowResults(true);
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);
  
  const handleAdd = () => {
    if (selectedProduct && quantity > 0) {
      onAdd(selectedProduct, quantity, discount);
      setSelectedProduct(null);
      setSearch('');
      setQuantity(1);
      setDiscount(0);
      setShowResults(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          label="Search Product"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        
        {showResults && products.length > 0 && !selectedProduct && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {products.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => {
                  setSelectedProduct(product);
                  setSearch(product.name);
                  setShowResults(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">S/{product.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Stock: {product.stock}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {selectedProduct && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Selected Product</p>
            <p className="font-semibold">{selectedProduct.name}</p>
            <p className="text-sm text-gray-600">Price: S/{selectedProduct.price.toFixed(2)}</p>
          </div>
          
          <Input
            type="number"
            label="Quantity"
            min="1"
            max={selectedProduct.stock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
          
          <Input
            type="number"
            label="Discount (%)"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          />
          
          <div className="md:col-span-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-xl font-bold">
                  S/{(selectedProduct.price * quantity * (1 - discount / 100)).toFixed(2)}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearch('');
                    setQuantity(1);
                    setDiscount(0);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAdd}
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
