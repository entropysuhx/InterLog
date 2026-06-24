import { getProductSnapshot } from "@/lib/data/product-snapshot";

export async function GET(): Promise<Response> {
  const viewer = await getProductSnapshot();
  if (!viewer.isAuthenticated || !viewer.snapshot) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json(
    {
      snapshot: viewer.snapshot,
      userName: viewer.userName,
      userImage: viewer.userImage,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
