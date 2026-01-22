import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function action({ request, params }: ActionFunctionArgs) {
  if (request.method !== 'PATCH') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const token = await requireUserToken(request);
  const formData = await request.formData();
  const stock = parseInt(formData.get('stock') as string);

  if (isNaN(stock) || stock < 0) {
    return json({ error: 'Invalid stock value' }, { status: 400 });
  }

  try {
    await api.updateProduct(token, params.id!, { stock });
    return json({ success: true, stock });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Failed to update stock' },
      { status: 400 }
    );
  }
}
