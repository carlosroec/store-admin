import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { requireUserToken } from "~/lib/auth.server";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card } from "~/components/ui/Card";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserToken(request);
  return json({});
}

export default function ReportsIndex() {
  const reports = [
    {
      name: "Sales Report",
      description: "View sales performance, revenue, top products and customers by date range",
      href: "/reports/sales",
      icon: "💰",
      color: "bg-green-100 text-green-800",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600 mt-2">
            View detailed analytics and reports for your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <Link key={report.href} to={report.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <span className="text-2xl">{report.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.name}
                    </h3>
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
