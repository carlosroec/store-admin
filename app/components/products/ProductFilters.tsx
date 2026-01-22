import { useRef } from "react";
import { Form, useSearchParams, useNavigate } from "@remix-run/react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface ProductFiltersProps {
  categories: string[];
  brands: string[];
}

export function ProductFilters({ categories, brands }: ProductFiltersProps) {
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();

  return (
    <Form ref={formRef} method="get" className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <Input
          type="text"
          name="search"
          placeholder="Search products..."
          defaultValue={searchParams.get('search') || ''}
        />

        {/* Category */}
        <select
          name="category"
          defaultValue={searchParams.get('category') || ''}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Brand */}
        <select
          name="brand"
          defaultValue={searchParams.get('brand') || ''}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        {/* In Stock */}
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={searchParams.get('inStock') === 'true'}
              className="mr-2 h-4 w-4"
            />
            <span className="text-sm">In Stock Only</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" className="flex-1 sm:flex-none">
          Apply Filters
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={() => {
            navigate('/products');
          }}
        >
          Clear
        </Button>
      </div>
    </Form>
  );
}
