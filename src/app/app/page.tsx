import { redirect } from "next/navigation";

/** Approved map: `/app` → `/app/dashboard` (docs/frontend/02-route-migration.md). */
export default function AppIndexPage() {
  redirect("/app/dashboard");
}
