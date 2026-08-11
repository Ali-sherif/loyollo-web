import { redirect } from "next/navigation";

/** Approved map: `/app` → `/app/dashboard`. */
export default function AppIndexPage() {
  redirect("/app/dashboard");
}
