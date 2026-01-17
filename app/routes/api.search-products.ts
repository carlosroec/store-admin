import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  if (search.length < 2) {
    return json({ products: [] });
  }

  try {
    const data = await api.getProducts(token, { search, limit: 10 });
    return json({ products: data.products || [] });
  } catch (error) {
    console.error("Failed to search products:", error);
    return json({ products: [], error: "Failed to search products" }, { status: 500 });
  }
}
