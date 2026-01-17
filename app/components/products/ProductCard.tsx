import { Link } from "@remix-run/react";
import type { Product } from "~/lib/api.server";
import { Card } from "../ui/Card";
import { OptimizedImage } from "../ui/OptimizedImage";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockStatus = product.stock > 0 ? 'In Stock' :
                     product.onTheWay > 0 ? 'Coming Soon' : 'Out of Stock';

  const stockColor = product.stock > 0 ? 'text-green-600' :
                    product.onTheWay > 0 ? 'text-yellow-600' : 'text-red-600';

  const isDisabled = product.isActive === false;

  return (
    <Link to={`/products/${product._id}`}>
      <Card className={`hover:shadow-lg transition-shadow cursor-pointer h-full ${isDisabled ? 'opacity-60' : ''}`}>
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
              <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {product.name}
              </h3>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${stockColor}`}>
              {stockStatus}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Stock: {product.stock}</span>
            {product.onTheWay > 0 && (
              <span className="text-yellow-600">
                +{product.onTheWay} incoming
              </span>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {product.category}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
