import { Stamp } from "lucide-react";

const REWARD_LABELS: Record<string, string> = {
  free_item: "Free item",
  discount: "Discount",
  custom: "Custom reward",
};

export function rewardLabel(value: string | null | undefined) {
  if (!value) return "";
  return REWARD_LABELS[value] ?? value;
}

export function StampCardPreview({
  businessName,
  visitsRequired,
  rewardDescription,
}: {
  businessName: string;
  visitsRequired: number;
  rewardDescription: string;
}) {
  const rawCount = Math.max(0, Math.floor(visitsRequired));
  const cap = 50;
  const count = Math.min(rawCount, cap);
  const extra = rawCount - count;
  const filled = Math.min(3, count);

  return (
    <section className="rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <h2 className="text-[20px] font-semibold text-[#0a152f]">Stamp card preview</h2>
      <p className="mt-1 text-[14px] text-[#737373]">See how customers will view this card.</p>

      <div className="mt-5 rounded-[12px] bg-[#0A152F] p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#eef1f7]/80">
          {businessName || "Your business"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {count > 0 ? (
            Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  i < filled
                    ? "border-[#feb602] bg-[#ffe48a] text-[#0a152f]"
                    : "border-[#d7ddea] bg-white text-[#8698bb]"
                }`}
                aria-hidden
              >
                <Stamp className="h-5 w-5" />
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#eef1f7]/80">
              Enter visits required to preview stamps.
            </p>
          )}
          {extra > 0 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-[#d7ddea] bg-white text-[13px] font-semibold text-[#737373]">
              +{extra}
            </div>
          )}
        </div>

        <p className="mt-5 text-[14px] font-medium text-white">
          {count > 0 ? `${filled} of ${rawCount} stamps` : "No stamps yet"}
        </p>
        <p className="mt-2 text-[13px] text-[#eef1f7]/80">
          Reward:{" "}
          <span className="font-medium text-white">{rewardDescription || "Your reward here"}</span>
        </p>
      </div>
    </section>
  );
}

/**
 * Compact stamp-card preview sized for a phone-frame mock (JoinPreview / real
 * join page rewards-preview slot). Same visual language as StampCardPreview.
 */
export function StampCardPreviewCompact({
  businessName,
  visitsRequired,
  rewardDescription,
  accentColor = "#FEB602",
}: {
  businessName: string;
  visitsRequired: number;
  rewardDescription: string;
  accentColor?: string;
}) {
  const rawCount = Math.max(0, Math.floor(visitsRequired));
  const cap = 10;
  const count = Math.min(rawCount, cap);
  const extra = rawCount - count;
  const filled = Math.min(1, count);

  return (
    <div className="rounded-[10px] bg-[#0A152F] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
        {businessName || "Your business"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {count > 0 ? (
          Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-full border"
              style={
                i < filled
                  ? { borderColor: accentColor, backgroundColor: accentColor + "66" }
                  : { borderColor: "rgba(255,255,255,0.25)", backgroundColor: "transparent" }
              }
              aria-hidden
            >
              <Stamp
                className="h-3 w-3"
                style={{ color: i < filled ? "#0a152f" : "rgba(255,255,255,0.6)" }}
              />
            </div>
          ))
        ) : (
          <p className="text-[11px] text-white/70">Set visits required to preview.</p>
        )}
        {extra > 0 && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-white/30 text-[9px] font-semibold text-white/70">
            +{extra}
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-white/80">
        Reward: <span className="font-medium text-white">{rewardDescription || "Your reward"}</span>
      </p>
    </div>
  );
}
