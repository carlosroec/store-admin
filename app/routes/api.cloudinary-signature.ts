import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const body = await request.json();
  const folder = body.folder || "products";

  try {
    const signature = await api.getCloudinarySignature(token, folder);
    return json(signature);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to get signature" },
      { status: 500 }
    );
  }
}
