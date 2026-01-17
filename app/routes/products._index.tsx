import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ProductCard } from "~/components/products/ProductCard";
import { ProductFilters } from "~/components/products/ProductFilters";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);

  const filters = {
    search: url.searchParams.get('search') || undefined,
    category: url.searchParams.get('category') || undefined,
    brand: url.searchParams.get('brand') || undefined,
    inStock: url.searchParams.get('inStock') === 'true' ? true : undefined,
    includeInactive: true, // Show all products including disabled ones in admin
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: 12,
  };

  const [productsData, categoriesData, brandsData] = await Promise.all([
    api.getProducts(token, filters),
    api.getCategories(token),
    api.getBrands(token),
  ]);

  return json({
    products: productsData.products,
    pagination: productsData.pagination,
    categories: categoriesData.categories,
    brands: brandsData.brands,
  });
}

export default function ProductsIndex() {
  const { products, pagination, categories, brands } = useLoaderData<typeof loader>();
  
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-1">
            {pagination.total} total
          </p>
        </div>
        <Link to="/products/new">
          <Button variant="primary" className="w-full sm:w-auto">
            + Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 sm:mb-8">
        <ProductFilters categories={categories} brands={brands} />
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <Link to="/products/new">
            <Button variant="primary" className="mt-4">
              Create your first product
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  to={`?page=${page}`}
                  className={`
                    px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm
                    ${page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {page}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
