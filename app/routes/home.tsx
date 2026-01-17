import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);

  try {
    const profile = await api.getProfile(token);
    return json({ user: profile.user });
  } catch (error) {
    throw new Response('Unauthorized', { status: 401 });
  }
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome back!</h2>

        <Card className="mb-8">
          <p className="text-gray-600 mb-2">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-gray-600">
            <strong>User ID:</strong> {user.id}
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Products</h3>
              <p className="text-gray-600">Manage your inventory</p>
            </Card>
          </Link>

          <Link to="/customers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Customers</h3>
              <p className="text-gray-600">View customer list</p>
            </Card>
          </Link>

          <Link to="/sales">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Sales</h3>
              <p className="text-gray-600">Track your sales</p>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
