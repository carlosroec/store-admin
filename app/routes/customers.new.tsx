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
    documentType: documentType || undefined,
    documentNumber: documentNumber?.trim() || undefined,
    phone: phone?.trim() || undefined,
    email: email?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

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
    const result = await api.createCustomer(token, customerData);
    return redirect(`/customers/${result.customer._id}`);
  } catch (error) {
    return json(
      { errors: { general: error instanceof Error ? error.message : "Failed to create customer" } },
      { status: 400 }
    );
  }
}

export default function NewCustomer() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to="/customers"
            className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block"
          >
            &larr; Back to Customers
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create New Customer</h2>
          <p className="text-gray-600 mt-1">Quick customer registration</p>
        </div>

        {actionData?.errors?.general && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors.general}
          </div>
        )}

        <Form method="post" className="space-y-6">
          {/* Required Fields */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Required Information</h3>

            <div className="space-y-4">
              <Input
                type="text"
                name="fullName"
                label="Full Name *"
                placeholder="Enter customer's full name"
                error={actionData?.errors?.fullName}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Media Source *
                </label>
                <select
                  name="socialMediaSource"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  defaultValue=""
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
                label="Username (optional)"
                placeholder="@username"
              />

              <Input
                type="text"
                name="socialMediaProfileUrl"
                label="Profile URL (optional)"
                placeholder="https://..."
              />
            </div>
          </Card>

          {/* Optional Fields */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">Additional Information (Optional)</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    name="documentType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue=""
                  >
                    <option value="">None</option>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="RUC">RUC</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>

                <Input type="text" name="documentNumber" label="Document Number" placeholder="12345678" />
              </div>

              <Input
                type="tel"
                name="phone"
                label="Phone"
                placeholder="9XX XXX XXX"
              />

              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="email@example.com"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any additional notes about this customer..."
                />
              </div>
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
              />

              <Input
                type="text"
                name="city"
                label="City"
                placeholder="City"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="district"
                  label="District"
                  placeholder="District"
                />

                <Input
                  type="text"
                  name="province"
                  label="Province"
                  placeholder="Province"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="department"
                  label="Department"
                  placeholder="Department"
                />

                <Input
                  type="text"
                  name="postalCode"
                  label="Postal Code"
                  placeholder="Postal code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <textarea
                  name="reference"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Address reference or delivery instructions..."
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link to="/customers">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Customer
            </Button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
