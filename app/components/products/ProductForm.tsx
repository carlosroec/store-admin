import { useState } from "react";
import { Form, useNavigation } from "@remix-run/react";
import type { Product } from "~/lib/api.server";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ImageUpload } from "../ui/ImageUpload";
import { MarkdownEditor } from "../ui/MarkdownEditor";

interface ProductFormProps {
  product?: Product;
  errors?: Record<string, string>;
}

export function ProductForm({ product, errors }: ProductFormProps) {
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
        <Input
          type="text"
          name="brand"
          label="Brand"
          placeholder="Apple"
          defaultValue={product?.brand}
          error={errors?.brand}
          required
        />
        
        {/* Category */}
        <Input
          type="text"
          name="category"
          label="Category"
          placeholder="Electronics"
          defaultValue={product?.category}
          error={errors?.category}
          required
        />
        
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
        
        {/* On The Way */}
        <Input
          type="number"
          name="onTheWay"
          label="On The Way"
          placeholder="5"
          min="0"
          defaultValue={product?.onTheWay}
          error={errors?.onTheWay}
        />
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
