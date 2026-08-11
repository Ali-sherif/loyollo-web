import { requireUser } from "@/lib/server/auth/guards";

export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();
  return <>{children}</>;
}
