import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
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

  if (!id) {
    return json({ errors: { general: "Customer ID required" } }, { status: 400 });
  }

  const fullName = formData.get("fullName") as string;
  const socialMediaSource = formData.get("socialMediaSource") as string;
  const socialMediaUsername = formData.get("socialMediaUsername") as string;
  const socialMediaProfileUrl = formData.get("socialMediaProfileUrl") as string;
  const socialMediaNotes = formData.get("socialMediaNotes") as string;
  const documentType = formData.get("documentType") as string;
  const documentNumber = formData.get("documentNumber") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  // Address fields
  const street = formData.get("street") as string;
  const city = formData.get("city") as string;
  const district = formData.get("district") as string;
  const province = formData.get("province") as string;
  const department = formData.get("department") as string;
  const postalCode = formData.get("postalCode") as string;
  const reference = formData.get("reference") as string;

  const errors: Record<string, string> = {};

  if (!fullName || fullName.trim() === "") {
    errors.fullName = "Full name is required";
  }

  if (!socialMediaSource) {
    errors.socialMediaSource = "Social media source is required";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  const customerData: any = {
    fullName: fullName.trim(),
    socialMedia: {
      source: socialMediaSource,
      username: socialMediaUsername?.trim() || undefined,
      profileUrl: socialMediaProfileUrl?.trim() || undefined,
      notes: socialMediaNotes?.trim() || undefined,
    },
    phone: phone?.trim() || undefined,
    email: email?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

  // Only include document if both type and number are provided
  if (documentType && documentNumber?.trim()) {
    customerData.documentType = documentType;
    customerData.documentNumber = documentNumber.trim();
  }

  // Only include address if at least street is provided
  if (street?.trim()) {
    customerData.address = {
      street: street.trim(),
      city: city?.trim() || undefined,
      district: district?.trim() || undefined,
      province: province?.trim() || undefined,
      department: department?.trim() || undefined,
      postalCode: postalCode?.trim() || undefined,
      reference: reference?.trim() || undefined,
    };
  }

  try {
    await api.updateCustomer(token, id, customerData);
    return redirect(`/customers/${id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : "Failed to update customer" } },
      { status: 400 }
    );
  }
}

export default function EditCustomer() {
  const { customer } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to={`/customers/${customer._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to Customer Details
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Edit Customer</h2>
          <p className="text-gray-600 mt-1">{customer.fullName}</p>
        </div>

        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}

        <Form method="post" className="space-y-6">
          {/* Required Fields */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

            <div className="space-y-4">
              <Input
                type="text"
                name="fullName"
                label="Full Name *"
                placeholder="Enter customer's full name"
                defaultValue={customer.fullName}
                error={actionData?.errors?.fullName}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Media Source *
                </label>
                <select
                  name="socialMediaSource"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  defaultValue={customer.socialMedia?.source || ""}
                >
                  <option value="" disabled>
                    Select source...
                  </option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
                {actionData?.errors?.socialMediaSource && (
                  <p className="mt-1 text-sm text-red-600">{actionData.errors.socialMediaSource}</p>
                )}
              </div>

              <Input
                type="text"
                name="socialMediaUsername"
                label="Username"
                placeholder="@username"
                defaultValue={customer.socialMedia?.username || ""}
              />

              <Input
                type="text"
                name="socialMediaProfileUrl"
                label="Profile URL"
                placeholder="https://..."
                defaultValue={customer.socialMedia?.profileUrl || ""}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Media Notes
                </label>
                <textarea
                  name="socialMediaNotes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes about social media contact..."
                  defaultValue={customer.socialMedia?.notes || ""}
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    name="documentType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue={customer.documentType || ""}
                  >
                    <option value="">None</option>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="RUC">RUC</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>

                <Input
                  type="text"
                  name="documentNumber"
                  label="Document Number"
                  placeholder="12345678"
                  defaultValue={customer.documentNumber || ""}
                />
              </div>

              <Input
                type="tel"
                name="phone"
                label="Phone"
                placeholder="9XX XXX XXX"
                defaultValue={customer.phone || ""}
              />

              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="email@example.com"
                defaultValue={customer.email || ""}
              />
            </div>
          </Card>

          {/* Address */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Address (Optional)</h3>

            <div className="space-y-4">
              <Input
                type="text"
                name="street"
                label="Street Address"
                placeholder="Street name and number"
                defaultValue={customer.address?.street || ""}
              />

              <Input
                type="text"
                name="city"
                label="City"
                placeholder="City"
                defaultValue={customer.address?.city || ""}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="district"
                  label="District"
                  placeholder="District"
                  defaultValue={customer.address?.district || ""}
                />

                <Input
                  type="text"
                  name="province"
                  label="Province"
                  placeholder="Province"
                  defaultValue={customer.address?.province || ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="department"
                  label="Department"
                  placeholder="Department"
                  defaultValue={customer.address?.department || ""}
                />

                <Input
                  type="text"
                  name="postalCode"
                  label="Postal Code"
                  placeholder="Postal code"
                  defaultValue={customer.address?.postalCode || ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <textarea
                  name="reference"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Address reference or delivery instructions..."
                  defaultValue={customer.address?.reference || ""}
                />
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Any additional notes about this customer..."
              defaultValue={customer.notes || ""}
            />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link to={`/customers/${customer._id}`}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
