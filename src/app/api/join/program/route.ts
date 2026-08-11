import { enrollCustomer, getJoinProgram } from "@/lib/server/join-service";
import { logger } from "@/lib/server/logger";

export const runtime = "nodejs";

/** Lightweight in-memory rate limit (ADR-012). Replace with Redis/Upstash in production. */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
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

export async function GET(request: Request) {
  const programId = new URL(request.url).searchParams.get("programId");
  if (!programId) {
    return Response.json({ error: "programId required" }, { status: 400 });
  }
  try {
    const program = await getJoinProgram({ programId });
    return Response.json(program);
  } catch (error) {
    logger.error("join.program.failed", { error: String(error) });
    return Response.json({ error: "Failed to load program" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // enroll lives on /api/join/enroll — keep GET-only here
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
