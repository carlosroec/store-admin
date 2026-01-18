import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function action({ request }: ActionFunctionArgs) {
  const token = await requireUserToken(request);
  const body = await request.json();
  const { publicId } = body;

  if (!publicId) {
    return json({ error: "publicId is required" }, { status: 400 });
  }

  try {
    await api.deleteCloudinaryImage(token, publicId);
    return json({ success: true });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to delete image" },
      { status: 500 }
    );
  }
}
