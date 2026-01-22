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
  const data = await api.getBrand(token, params.id!);

  return json({ brand: data.brand });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const formData = await request.formData();
  const action = formData.get('_action');

  if (action === 'delete') {
    await api.deleteBrand(token, params.id!);
    return redirect('/brands');
  }

  if (action === 'toggle-active') {
    const isActive = formData.get('isActive') === 'true';
    await api.updateBrand(token, params.id!, { isActive: !isActive });
    return redirect(`/brands/${params.id}`);
  }

  const brandData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string || undefined,
    description: formData.get('description') as string || undefined,
    logo: formData.get('logo') as string || undefined,
    order: parseInt(formData.get('order') as string) || 0,
  };

  // Validation
  const errors: Record<string, string> = {};

  if (!brandData.name) errors.name = 'Name is required';

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await api.updateBrand(token, params.id!, brandData);
    return redirect(`/brands/${params.id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : 'Failed to update brand' } },
      { status: 400 }
    );
  }
}

export default function EditBrand() {
  const { brand } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to={`/brands/${brand._id}`}
          className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
        >
          ← Back to Brand
        </Link>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Edit Brand
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
              placeholder="Brand name"
              defaultValue={brand.name}
              error={(actionData?.errors as Record<string, string> | undefined)?.name}
              required
            />

            <Input
              type="text"
              name="slug"
              label="Slug"
              placeholder="brand-slug"
              defaultValue={brand.slug}
              error={(actionData?.errors as Record<string, string> | undefined)?.slug}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                name="description"
                placeholder="Brand description..."
                rows={3}
                defaultValue={brand.description || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <Input
              type="url"
              name="logo"
              label="Logo URL (optional)"
              placeholder="https://example.com/logo.png"
              defaultValue={brand.logo || ''}
              error={(actionData?.errors as Record<string, string> | undefined)?.logo}
            />

            <Input
              type="number"
              name="order"
              label="Display Order"
              placeholder="0"
              defaultValue={brand.order}
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
                Update Brand
              </Button>
            </div>
          </Form>
        </Card>

        {/* Status Toggle */}
        <Card className={`mt-6 ${brand.isActive ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${brand.isActive ? 'text-yellow-800' : 'text-green-800'}`}>
            Brand Status
          </h3>
          <p className={`text-sm mb-4 ${brand.isActive ? 'text-yellow-600' : 'text-green-600'}`}>
            {brand.isActive
              ? 'This brand is currently active and visible in the store.'
              : 'This brand is disabled and will not appear in the store.'}
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="toggle-active" />
            <input type="hidden" name="isActive" value={brand.isActive.toString()} />
            <Button
              type="submit"
              variant={brand.isActive ? 'secondary' : 'primary'}
            >
              {brand.isActive ? 'Disable Brand' : 'Enable Brand'}
            </Button>
          </Form>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Deleting a brand will mark it as inactive. Products using this brand will still work.
          </p>
          <Form method="post">
            <input type="hidden" name="_action" value="delete" />
            <Button
              type="submit"
              variant="danger"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this brand?')) {
                  e.preventDefault();
                }
              }}
            >
              Delete Brand
            </Button>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
