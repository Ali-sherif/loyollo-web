import { enrollCustomer } from "@/lib/server/join-service";
import { logger } from "@/lib/server/logger";

export const runtime = "nodejs";

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= limit) return false;
  row.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(`enroll:${ip}`)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await enrollCustomer(body as Parameters<typeof enrollCustomer>[0]);
    return Response.json(result);
  } catch (error) {
    logger.error("join.enroll.failed", { error: String(error) });
    return Response.json(
      { error: error instanceof Error ? error.message : "Enrollment failed" },
      { status: 400 },
    );
  }
}
