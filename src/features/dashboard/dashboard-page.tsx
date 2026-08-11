"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import * as React from "react";
import { Check, Circle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SetupCompleteDashboard } from "@/components/dashboard/SetupCompleteDashboard";

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href?: string;
};

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();

  const [fullName, setFullName] = React.useState<string>("");
  const [ready, setReady] = React.useState(false);
  const [programId, setProgramId] = React.useState<string | null>(null);
  const [hasProgram, setHasProgram] = React.useState(false);
  const [hasRewards, setHasRewards] = React.useState(false);
  const [hasCustomers, setHasCustomers] = React.useState(false);
  const [hasCampaigns, setHasCampaigns] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isVerified) {
      navigate({
        to: "/verify",
        search: { email: user.email ?? "" },
        replace: true,
      });
      return;
    }
    (async () => {
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select("full_name, business_name, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!data?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      const full = (data?.full_name as string | null)?.trim() ?? "";
      setFullName(full || (user.email?.split("@")[0] ?? ""));

      const { data: program } = await getAuthSupabase()
        .from("loyalty_programs")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      setHasProgram(!!program);
      setProgramId(program?.id ?? null);
      if (program?.id) {
        const [{ data: reward }, { data: customer }, { data: campaign }] = await Promise.all([
          getAuthSupabase()
            .from("rewards")
            .select("id")
            .eq("loyalty_program_id", program.id)
            .limit(1)
            .maybeSingle(),
          getAuthSupabase()
            .from("customers")
            .select("id")
            .eq("loyalty_program_id", program.id)
            .limit(1)
            .maybeSingle(),
          getAuthSupabase()
            .from("campaigns")
            .select("id")
            .eq("loyalty_program_id", program.id)
            .limit(1)
            .maybeSingle(),
        ]);
        setHasRewards(!!reward);
        setHasCustomers(!!customer);
        setHasCampaigns(!!campaign);
      } else {
        setHasRewards(false);
        setHasCustomers(false);
        setHasCampaigns(false);
      }
      setReady(true);
    })();
  }, [user, isVerified, loading, navigate]);

  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  React.useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [ready]);

  if (loading || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  const checklist: ChecklistItem[] = [
    {
      id: "program",
      title: "Create Loyalty Program",
      description: "Set up how customers earn points and engage with your business.",
      done: hasProgram,
      href: "/loyalty-program",
    },
    {
      id: "reward",
      title: "Create Your First Reward",
      description: "Give customers something valuable to redeem with their points.",
      done: hasRewards,
      href: "/loyalty-program",
    },
    {
      id: "customer",
      title: "Add Your First Customer",
      description: "Start building your customer base and tracking engagement.",
      done: hasCustomers,
      href: "/customers",
    },
    {
      id: "campaign",
      title: "Launch Your First Campaign",
      description: "Send an email or SMS campaign to drive customer engagement.",
      done: hasCampaigns,
      href: "/campaigns",
    },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const total = checklist.length;
  const progress = (completedCount / total) * 100;
  const nextStep = checklist.find((c) => !c.done);
  const continueHref = nextStep?.href ?? "/loyalty-program";
  const setupComplete = completedCount === total && !!programId;

  return (
    <DashboardShell firstName={fullName} onSignOut={signOut}>
      {setupComplete && programId ? (
        <SetupCompleteDashboard fullName={fullName} programId={programId} />
      ) : (
        <div className="mx-auto max-w-[1120px] rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(15,28,61,0.04)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
            {/* Welcome / empty state copy */}
            <section className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center rounded-full bg-[#fff9e6] px-3 py-1 text-xs font-medium text-[#e29f00]">
                Welcome {fullName || "back"}
              </span>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-4 text-[24px] font-bold leading-[1.2] text-[#0a152f] outline-none sm:text-[28px]"
              >
                Let's Launch Your Loyalty Program <span aria-hidden>🚀</span>
              </h1>
              <p className="mt-3 max-w-[480px] text-[14px] leading-[1.6] text-[#525252]">
                You're just a few steps away from turning first-time visitors into loyal customers.
                Complete the setup checklist below to start collecting customers, rewarding loyalty,
                and growing repeat business.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: continueHref })}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Continue Setup
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </section>

            {/* Getting Started checklist */}
            <aside
              aria-labelledby="getting-started-heading"
              className="rounded-[16px] bg-[#eef1f7] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="getting-started-heading" className="text-[20px] font-bold text-[#0a152f]">
                  Getting Started
                </h2>
                <span className="text-sm font-semibold text-[#44b678]">
                  {completedCount}/{total} Completed
                </span>
              </div>
              <div
                className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#d7ddea]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={completedCount}
                aria-label="Setup progress"
              >
                <div
                  className="h-full rounded-full bg-[#44b678] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {checklist.map((item) => {
                  const content = (
                    <div className="flex items-start gap-3 rounded-[12px] border border-transparent bg-white p-4 shadow-[0_1px_2px_rgba(15,28,61,0.04)] transition hover:border-[#feb602]/40">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
                        aria-hidden
                      >
                        {item.done ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#effaf4] ring-1 ring-[#b2e7c7]">
                            <Check className="h-3.5 w-3.5 text-[#44b678]" strokeWidth={3} />
                          </span>
                        ) : (
                          <Circle className="h-6 w-6 text-[#b2e7c7]" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="text-[14px] font-semibold text-[#0a152f]">
                          {item.title}
                          <span className="sr-only">
                            {item.done ? " (completed)" : " (not started)"}
                          </span>
                        </p>
                        <p className="mt-1 text-[13px] leading-[1.5] text-[#737373]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <button
                          type="button"
                          onClick={() => navigate({ to: item.href! })}
                          className="block w-full rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                        >
                          {content}
                        </button>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default DashboardPage;
