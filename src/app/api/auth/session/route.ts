import { getCurrentUser } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(
    { user },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
