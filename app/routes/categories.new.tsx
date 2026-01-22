import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, Form, useNavigation, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserToken(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();

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
    await api.createCategory(token, categoryData);
    return redirect('/categories');
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to create category' } },
      { status: 400 }
    );
  }
}

export default function NewCategory() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/categories"
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Categories
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Create New Category
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
              error={(actionData?.errors as Record<string, string> | undefined)?.name}
              required
            />

            <Input
              type="text"
              name="slug"
              label="Slug (optional)"
              placeholder="category-slug (auto-generated if empty)"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <Input
              type="url"
              name="image"
              label="Image URL (optional)"
              placeholder="https://example.com/image.jpg"
              error={(actionData?.errors as Record<string, string> | undefined)?.image}
            />

            <Input
              type="number"
              name="order"
              label="Display Order"
              placeholder="0"
              defaultValue="0"
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
                Create Category
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
