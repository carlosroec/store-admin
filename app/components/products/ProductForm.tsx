import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";
import type { Product, Category, Brand } from "~/lib/api.server";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ImageUpload } from "../ui/ImageUpload";
import { MarkdownEditor } from "../ui/MarkdownEditor";

interface ProductFormProps {
  product?: Product;
  errors?: Record<string, string>;
  categories?: Category[];
  brands?: Brand[];
}

export function ProductForm({ product, errors, categories = [], brands = [] }: ProductFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [images, setImages] = useState<string[]>(product?.images || []);
  
  return (
    <Form method="post" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SKU */}
        <Input
          type="text"
          name="sku"
          label="SKU"
          placeholder="PROD-001"
          defaultValue={product?.sku}
          error={errors?.sku}
          required
        />
        
        {/* Name */}
        <Input
          type="text"
          name="name"
          label="Product Name"
          placeholder="MacBook Pro 14"
          defaultValue={product?.name}
          error={errors?.name}
          required
        />
        
        {/* Brand */}
        {brands.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              name="brand"
              defaultValue={product?.brand || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a brand...</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
            {errors?.brand && (
              <p className="mt-1 text-sm text-red-600">{errors.brand}</p>
            )}
          </div>
        ) : (
          <Input
            type="text"
            name="brand"
            label="Brand"
            placeholder="Apple"
            defaultValue={product?.brand}
            error={errors?.brand}
            required
          />
        )}

        {/* Category */}
        {categories.length > 0 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              defaultValue={product?.category || ''}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a category...</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors?.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        ) : (
          <Input
            type="text"
            name="category"
            label="Category"
            placeholder="Electronics"
            defaultValue={product?.category}
            error={errors?.category}
            required
          />
        )}
        
        {/* Price */}
        <Input
          type="number"
          name="price"
          label="Price (IGV included)"
          placeholder="1999.99"
          step="0.01"
          min="0"
          defaultValue={product?.price}
          error={errors?.price}
          required
        />

        {/* Offer Price */}
        <Input
          type="number"
          name="offerPrice"
          label="Offer Price (optional)"
          placeholder="0.00"
          step="0.01"
          min="0"
          defaultValue={product?.offerPrice || 0}
          error={errors?.offerPrice}
        />

        {/* Stock */}
        <Input
          type="number"
          name="stock"
          label="Stock"
          placeholder="10"
          min="0"
          defaultValue={product?.stock}
          error={errors?.stock}
          required
        />

        {/* Top Sales */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isTopSales"
            id="isTopSales"
            defaultChecked={product?.isTopSales || false}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isTopSales" className="ml-2 block text-sm text-gray-900">
            Feature as Top Sale (show in "Destacados" section)
          </label>
        </div>
      </div>
      
      {/* Description */}
      <MarkdownEditor
        name="description"
        label="Description"
        defaultValue={product?.description}
        placeholder="Product description... (supports Markdown)"
        rows={6}
        error={errors?.description}
      />
      
      {/* Images */}
      <ImageUpload
        images={images}
        onChange={setImages}
        maxImages={5}
        folder="products"
      />
      
      {/* Actions */}
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
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </Form>
  );
}
