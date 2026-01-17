import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  if (search.length < 2) {
    return json({ customers: [] });
  }

  try {
    const data = await api.getCustomers(token, { search, limit: 10 });
    return json({ customers: data.customers || [] });
  } catch (error) {
    console.error("Failed to search customers:", error);
    return json({ customers: [], error: "Failed to search customers" }, { status: 500 });
  }
}
