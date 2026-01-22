import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, Form, useNavigation, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const data = await api.getCategory(token, params.id!);

  return json({ category: data.category });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'delete') {
    await api.deleteCategory(token, params.id!);
    return redirect('/categories');
  }

  if (action === 'toggle-active') {
    const isActive = formData.get('isActive') === 'true';
    await api.updateCategory(token, params.id!, { isActive: !isActive });
    return redirect(`/categories/${params.id}`);
  }

  const categoryData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string || undefined,
    description: formData.get('description') as string || undefined,
    image: formData.get('image') as string || undefined,
    order: parseInt(formData.get('order') as string) || 0,
  };

  // Validation
  const errors: Record<string, string> = {};

  if (!categoryData.name) errors.name = 'Name is required';

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await api.updateCategory(token, params.id!, categoryData);
    return redirect(`/categories/${params.id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to update category' } },
      { status: 400 }
    );
  }
}

export default function EditCategory() {
  const { category } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to={`/categories/${category._id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Category
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Category
        </h2>

        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}

        <Card>
          <Form method="post" className="space-y-6">
            <Input
              type="text"
              name="name"
              label="Name"
              placeholder="Category name"
              defaultValue={category.name}
              error={(actionData?.errors as Record<string, string> | undefined)?.name}
              required
            />

            <Input
              type="text"
              name="slug"
              label="Slug"
              placeholder="category-slug"
              defaultValue={category.slug}
              error={(actionData?.errors as Record<string, string> | undefined)?.slug}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                name="description"
                placeholder="Category description..."
                rows={3}
                defaultValue={category.description || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <Input
              type="url"
              name="image"
              label="Image URL (optional)"
              placeholder="https://example.com/image.jpg"
              defaultValue={category.image || ''}
              error={(actionData?.errors as Record<string, string> | undefined)?.image}
            />

            <Input
              type="number"
              name="order"
              label="Display Order"
              placeholder="0"
              defaultValue={category.order}
              min="0"
              error={(actionData?.errors as Record<string, string> | undefined)?.order}
            />

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
                Update Category
              </Button>
            </div>
          </Form>
        </Card>

        {/* Status Toggle */}
        <Card className={`mt-6 ${category.isActive ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${category.isActive ? 'text-yellow-800' : 'text-green-800'}`}>
            Category Status
          </h3>
          <p className={`text-sm mb-4 ${category.isActive ? 'text-yellow-600' : 'text-green-600'}`}>
            {category.isActive
              ? 'This category is currently active and visible in the store.'
              : 'This category is disabled and will not appear in the store.'}
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="toggle-active" />
            <input type="hidden" name="isActive" value={category.isActive.toString()} />
            <Button
              type="submit"
              variant={category.isActive ? 'secondary' : 'primary'}
            >
              {category.isActive ? 'Disable Category' : 'Enable Category'}
            </Button>
          </Form>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Deleting a category will mark it as inactive. Products using this category will still work.
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="delete" />
            <Button
              type="submit"
              variant="danger"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this category?')) {
                  e.preventDefault();
                }
              }}
            >
              Delete Category
            </Button>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
