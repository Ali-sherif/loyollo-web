import * as React from "react";
import { Info, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import telescopeImg from "@/assets/telescope-empty-state.png";

type ProgressRow = {
  key: string;
  label: string;
  progress: number; // 0..1
  count: number;
  action: "view" | "reminder" | "campaign";
};

type Props = {
  programId: string | null;
  visitsRequired: number;
};

/**
 * Visits Progress section for visit-based loyalty programs.
 *
 * TODO(feature): wire up to real visit-tracking data once the customer
 * enrollment + stamp/scan tables exist. Expected shape per row:
 *   { stamps_earned: number, customer_count: number }
 * grouped by stamps_earned, plus a "Redeemed" and "Completed" bucket.
 * Until then, `useVisitsProgress` returns an empty array and the section
 * renders the empty state.
 */
function useVisitsProgress(programId: string | null, visitsRequired: number) {
  const [rows, setRows] = React.useState<ProgressRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!programId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      // TODO(feature): replace with a real query, e.g.
      //   supabase.from("loyalty_stamp_progress")
      //     .select("stamps_earned, customer_count, status")
      //     .eq("loyalty_program_id", programId)
      // and map results to ProgressRow[]. The enrollment / scan tables
      // don't exist yet, so we intentionally return [] to render the
      // empty state.
      void supabase; // keep import used
      void visitsRequired;
      if (cancelled) return;
      setRows([]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, visitsRequired]);

  return { rows, loading };
}

export function VisitsProgressSection({ programId, visitsRequired }: Props) {
  const { rows, loading } = useVisitsProgress(programId, visitsRequired);
  const hasData = rows.length > 0;

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div>
        <h2 className="text-[20px] font-semibold leading-none text-[#0a152f]">
          Visits Progress
        </h2>
        <p className="mt-2 text-[14px] text-[#737373]">
          Monitor customer visits and launch targeted reminder campaigns.
        </p>
      </div>

      {hasData && (
        <div className="mt-6 flex items-center gap-2 rounded-[12px] border border-[#dbeafe] bg-[#eef1f7] p-4">
          <Info className="h-5 w-5 shrink-0 text-[#2563eb]" aria-hidden />
          <p className="text-[14px] leading-[1.4] text-[#2563eb]">
            Businesses using automated reminders see up to 40% higher customer retention and stronger repeat revenue.
          </p>
        </div>
      )}

      {!programId ? (
        <div className="mt-6 flex flex-col items-center rounded-[12px] border-2 border-dashed border-[#d7ddea] bg-[#fafafa] p-6 text-center">
          <p className="text-[13px] text-[#525252]">
            Save your visit-based program first to start tracking customer progress.
          </p>
        </div>
      ) : loading ? (
        <div className="mt-6 flex items-center justify-center py-8 text-[#8698bb]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        </div>
      ) : !hasData ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <img
            src={telescopeImg}
            alt=""
            width={149}
            height={110}
            loading="lazy"
            className="h-[110px] w-auto"
          />
          <p className="mt-4 text-[20px] font-bold text-[#0a152f]">
            No visit activity yet
          </p>
          <p className="mt-2 max-w-[458px] text-[14px] leading-[1.4] text-[#737373]">
            Once customers start earning stamps under this program, their progress will show here — with quick actions to nudge, remind, or reward them.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[16px] border border-[#d7ddea]">
          <div className="flex h-12 items-center bg-[#eef1f7]">
            <div className="flex-1 px-4 text-[16px] font-semibold text-[#5d74a2]">Progress</div>
            <div className="flex-1 px-4 text-[16px] font-semibold text-[#5d74a2]">Customers</div>
            <div className="flex-1 px-4 text-[16px] font-semibold text-[#5d74a2]">Action</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.key}
              className="flex h-[49px] items-center border-t border-[#d7ddea] bg-white"
            >
              <div className="flex flex-1 items-center gap-2 px-4">
                <ProgressBar value={r.progress} />
                <span className="whitespace-nowrap text-[14px] text-[#737373]">
                  {r.label}
                </span>
              </div>
              <div className="flex-1 px-4 text-[14px] text-[#737373]">{r.count}</div>
              <div className="flex-1 px-4">
                <ActionLink action={r.action} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const isFull = pct >= 100;
  return (
    <div className="h-[12px] w-[76px] overflow-hidden rounded-full bg-[#eef1f7]">
      <div
        className={`h-full rounded-full ${isFull ? "bg-[#44b678]" : "bg-[#feb602]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ActionLink({ action }: { action: ProgressRow["action"] }) {
  const label =
    action === "view"
      ? "View Members"
      : action === "reminder"
        ? "Send Reminder"
        : "Send Campaign";
  const color =
    action === "view" ? "#44b678" : action === "reminder" ? "#feb602" : "#2a3f6e";
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-[14px] font-semibold focus:outline-none focus-visible:underline"
      style={{ color }}
      // TODO(feature): wire up per-row actions (member list drawer, reminder
      // campaign composer) once those flows exist.
      onClick={(e) => e.preventDefault()}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </button>
  );
}
