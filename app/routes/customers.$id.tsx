import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link, useNavigation } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;

  if (!id) {
    throw new Response("Customer ID required", { status: 400 });
  }

  try {
    const data = await api.getCustomer(token, id);
    return json({ customer: data.customer });
  } catch (error) {
    throw new Response("Customer not found", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (!id) {
    return json({ error: "Customer ID required" }, { status: 400 });
  }

  try {
    if (intent === "delete") {
      await api.deleteCustomer(token, id);
      return redirect("/customers");
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Action failed" },
      { status: 400 }
    );
  }
}

export default function CustomerDetail() {
  const { customer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/customers"
              className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
            >
              &larr; Back to Customers
            </Link>
            <h2 className="text-3xl font-bold text-gray-900">{customer.fullName}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/customers/${customer._id}/edit`}>
              <Button variant="secondary">Edit Customer</Button>
            </Link>
          </div>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        {/* Basic Information */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{customer.fullName}</p>
            </div>
            {customer.documentType && customer.documentNumber && (
              <div>
                <p className="text-sm text-gray-600">Document</p>
                <p className="font-medium">
                  {customer.documentType}: {customer.documentNumber}
                </p>
              </div>
            )}
            {customer.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            {customer.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Social Media */}
        {customer.socialMedia && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Social Media</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Source</p>
                <p className="font-medium capitalize">{customer.socialMedia.source}</p>
              </div>
              {customer.socialMedia.username && (
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-medium">@{customer.socialMedia.username}</p>
                </div>
              )}
              {customer.socialMedia.profileUrl && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Profile URL</p>
                  <a
                    href={customer.socialMedia.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {customer.socialMedia.profileUrl}
                  </a>
                </div>
              )}
              {customer.socialMedia.referredBy && (
                <div>
                  <p className="text-sm text-gray-600">Referred By</p>
                  <p className="font-medium">{customer.socialMedia.referredBy}</p>
                </div>
              )}
              {customer.socialMedia.campaignId && (
                <div>
                  <p className="text-sm text-gray-600">Campaign ID</p>
                  <p className="font-medium">{customer.socialMedia.campaignId}</p>
                </div>
              )}
              {customer.socialMedia.firstContactDate && (
                <div>
                  <p className="text-sm text-gray-600">First Contact</p>
                  <p className="font-medium">
                    {new Date(customer.socialMedia.firstContactDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {customer.socialMedia.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Social Media Notes</p>
                  <p className="font-medium">{customer.socialMedia.notes}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Address */}
        {customer.address && customer.address.street && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Street</p>
                <p className="font-medium">{customer.address.street}</p>
              </div>
              {customer.address.district && (
                <div>
                  <p className="text-sm text-gray-600">District</p>
                  <p className="font-medium">{customer.address.district}</p>
                </div>
              )}
              {customer.address.province && (
                <div>
                  <p className="text-sm text-gray-600">Province</p>
                  <p className="font-medium">{customer.address.province}</p>
                </div>
              )}
              {customer.address.department && (
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{customer.address.department}</p>
                </div>
              )}
              {customer.address.postalCode && (
                <div>
                  <p className="text-sm text-gray-600">Postal Code</p>
                  <p className="font-medium">{customer.address.postalCode}</p>
                </div>
              )}
              {customer.address.reference && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-medium">{customer.address.reference}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Notes */}
        {customer.notes && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <p className="text-gray-700">{customer.notes}</p>
          </Card>
        )}

        {/* Metadata */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">
                {new Date(customer.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">
                {new Date(customer.updatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {customer.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
          <p className="text-gray-600 mb-4">
            Deleting a customer will mark them as inactive. This action can be undone by an administrator.
          </p>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmitting}
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this customer?")) {
                  e.preventDefault();
                }
              }}
            >
              Delete Customer
            </Button>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
