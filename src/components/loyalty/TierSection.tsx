import { assetSrc } from "@/lib/asset-src";
import * as React from "react";
import { toast } from "sonner";
import { Crown, Pencil, Trash2, Info, Tag, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import telescopeImg from "@/assets/telescope-empty-state.png";

export type Tier = {
  id: string;
  loyalty_program_id: string;
  name: string;
  color: string;
  points_threshold: number;
  benefits: string[];
  bonus_percentage: number;
  points_multiplier?: number;
  sort_order: number;
};

const BENEFIT_OPTIONS = [
  "Bonus Points Multiplier",
  "Exclusive Rewards",
  "Early Access Promotions",
  "Birthday Rewards",
  "Priority Support",
  "Custom Benefit",
] as const;

const COLOR_OPTIONS: {
  value: string;
  label: string;
  ring: string; // background token for icon chip
  text: string; // icon color
  badgeBg: string;
  badgeText: string;
  swatch: string;
}[] = [
  {
    value: "silver",
    label: "Silver",
    ring: "#F3F4F6",
    text: "#737373",
    badgeBg: "#F3F4F6",
    badgeText: "#424242",
    swatch: "#C0C0C0",
  },
  {
    value: "gold",
    label: "Gold",
    ring: "#FFF9E6",
    text: "#B48800",
    badgeBg: "#FFF1BF",
    badgeText: "#8A6A00",
    swatch: "#FEB602",
  },
  {
    value: "vip",
    label: "VIP",
    ring: "#EEF1F7",
    text: "#0F1C3D",
    badgeBg: "#D7DDEA",
    badgeText: "#0F1C3D",
    swatch: "#0F1C3D",
  },
  {
    value: "bronze",
    label: "Bronze",
    ring: "#F5EBE0",
    text: "#8B5A2B",
    badgeBg: "#F5EBE0",
    badgeText: "#8B5A2B",
    swatch: "#CD7F32",
  },
  {
    value: "emerald",
    label: "Emerald",
    ring: "#EFFAF4",
    text: "#267A4D",
    badgeBg: "#B2E7C7",
    badgeText: "#267A4D",
    swatch: "#44B678",
  },
];

export function colorFor(color: string) {
  return COLOR_OPTIONS.find((c) => c.value === color) ?? COLOR_OPTIONS[0];
}

type Props = {
  programId: string | null;
};

export function TierSection({ programId }: Props) {
  const [tiers, setTiers] = React.useState<Tier[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Tier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Tier | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!programId) {
      setTiers([]);
      return;
    }
    setLoading(true);
    const { data, error } = await getAuthSupabase()
      .from("loyalty_program_tiers")
      .select("*")
      .eq("loyalty_program_id", programId)
      .order("sort_order", { ascending: true });
    setLoading(false);
    if (error) {
      toast.error("Couldn't load tiers");
      return;
    }
    setTiers((data ?? []) as Tier[]);
  }, [programId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(t: Tier) {
    setEditing(t);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await getAuthSupabase()
      .from("loyalty_program_tiers")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Couldn't remove tier");
      return;
    }
    toast.success("Tier removed");
    setDeleteTarget(null);
    void load();
  }

  const hasTiers = tiers.length > 0;
  const canAdd = !!programId;

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">
            Tier structure{" "}
            <span className="text-[14px] font-normal text-[#737373]">(Optional)</span>
          </h2>
          <p className="mt-2 text-[14px] text-[#737373]">
            layer tiers on top of your points program
          </p>
        </div>
        {hasTiers && (
          <button
            type="button"
            onClick={openCreate}
            disabled={!canAdd}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-[#feb602] px-4 text-sm font-semibold text-white transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Tier
          </button>
        )}
      </div>

      {!canAdd ? (
        <div className="mt-6 flex flex-col items-center rounded-[12px] border-2 border-dashed border-[#d7ddea] bg-[#fafafa] p-6 text-center">
          <p className="text-[13px] text-[#525252]">
            Save your loyalty program first to start adding tiers.
          </p>
        </div>
      ) : !hasTiers ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <img
            src={assetSrc(telescopeImg)}
            alt=""
            width={149}
            height={110}
            loading="lazy"
            className="h-[110px] w-auto"
          />
          <p className="mt-4 text-[20px] font-bold text-[#0a152f]">No Tiers Created Yet!</p>
          <p className="mt-2 max-w-[458px] text-[14px] leading-[1.4] text-[#737373]">
            Create membership tiers to reward your most loyal customers with exclusive benefits,
            bonus points, and special rewards.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
          >
            + Create Tier
          </button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {tiers.map((t, i) => {
            const next = tiers[i + 1];
            const rangeLabel = next
              ? `${t.points_threshold.toLocaleString()} – ${(next.points_threshold - 1).toLocaleString()} points`
              : `${t.points_threshold.toLocaleString()}+ points`;
            const badge =
              t.bonus_percentage > 0
                ? `+${t.bonus_percentage}% bonus${t.benefits.includes("Exclusive Rewards") ? " · Exclusive rewards" : ""}`
                : (t.benefits[0] ?? "Standard rewards");
            const c = colorFor(t.color);
            return (
              <li
                key={t.id}
                className="flex items-center gap-4 rounded-[12px] border border-[#eef1f7] bg-white p-4 transition hover:border-[#d7ddea] hover:shadow-[0_1px_3px_rgba(10,13,18,0.08)]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: c.ring, color: c.text }}
                  aria-hidden
                >
                  <Crown className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold text-[#0a152f]">{t.name}</p>
                  <p className="mt-0.5 text-[14px] text-[#737373]">{rangeLabel}</p>
                </div>
                <span
                  className="hidden shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium sm:inline-flex"
                  style={{ backgroundColor: c.badgeBg, color: c.badgeText }}
                >
                  {badge}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    aria-label={`Edit ${t.name} tier`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-[#eef1f7] hover:text-[#0f1c3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    aria-label={`Delete ${t.name} tier`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
          {loading && (
            <li className="flex items-center justify-center py-2 text-[#8698bb]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </li>
          )}
        </ul>
      )}

      <TierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        programId={programId}
        editing={editing}
        existingTiers={tiers}
        onSaved={() => {
          setDialogOpen(false);
          void load();
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tier?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. Customers currently on this tier
              will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Removing…" : "Delete tier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function TierDialog({
  open,
  onOpenChange,
  programId,
  editing,
  existingTiers,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  programId: string | null;
  editing: Tier | null;
  existingTiers: Tier[];
  onSaved: () => void;
}) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("silver");
  const [threshold, setThreshold] = React.useState("");
  const [benefits, setBenefits] = React.useState<string[]>([]);
  const [bonusPct, setBonusPct] = React.useState("");
  const [multiplier, setMultiplier] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setColor(editing.color);
      setThreshold(String(editing.points_threshold));
      setBenefits(editing.benefits);
      setBonusPct(String(editing.bonus_percentage));
      setMultiplier(
        typeof editing.points_multiplier === "number" && editing.points_multiplier > 0
          ? String(editing.points_multiplier)
          : "",
      );
    } else {
      setName("");
      setColor("silver");
      setThreshold("");
      setBenefits([]);
      setBonusPct("");
      setMultiplier("");
    }
    setErrors({});
  }, [open, editing]);

  function toggleBenefit(b: string) {
    setBenefits((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter a tier name.";
    const th = Number(threshold);
    if (threshold === "" || Number.isNaN(th) || th < 0)
      next.threshold = "Enter a point threshold of 0 or more.";
    const bp = bonusPct === "" ? 0 : Number(bonusPct);
    if (Number.isNaN(bp) || bp < 0 || bp > 100) next.bonusPct = "Bonus must be between 0 and 100.";
    const mp = multiplier === "" ? 1 : Number(multiplier);
    if (Number.isNaN(mp) || mp < 0 || mp > 100)
      next.multiplier = "Multiplier must be between 0 and 100.";

    // ordering guardrail: threshold must not collide with another tier
    const siblings = existingTiers.filter((t) => t.id !== editing?.id);
    if (!next.threshold && siblings.some((t) => t.points_threshold === th))
      next.threshold = "Another tier already uses this threshold.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Radix Portal keeps this form outside the outer program <form> in the DOM,
    // but React synthetic events still bubble through the React tree — without
    // stopPropagation the outer "Save Program" handler also fires and navigates
    // to /dashboard before the tier edit is reflected.
    e.stopPropagation();
    if (!programId) return;
    if (!validate()) return;

    setSaving(true);
    const th = Number(threshold);
    const bp = bonusPct === "" ? 0 : Number(bonusPct);
    const mp = multiplier === "" ? 1 : Number(multiplier);
    const payload = {
      loyalty_program_id: programId,
      name: name.trim(),
      color,
      points_threshold: Math.floor(th),
      benefits,
      bonus_percentage: bp,
      points_multiplier: mp,
      sort_order: Math.floor(th),
    };
    const { error } = editing
      ? await getAuthSupabase().from("loyalty_program_tiers").update(payload).eq("id", editing.id)
      : await getAuthSupabase().from("loyalty_program_tiers").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Couldn't save tier");
      return;
    }
    toast.success(editing ? "Tier updated" : "Tier created");
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[452px] gap-0 rounded-[16px] p-0">
        <DialogHeader className="space-y-1 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-[20px] font-bold text-[#0a152f]">
            {editing ? "Edit Tier" : "Add New Tier"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#737373]">
            {editing
              ? "Update this customer tier's benefits and threshold."
              : "Create a new customer tier with exclusive benefits and rewards."}
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-[#eef1f7]" />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-6 py-5">
          <div className="flex items-start gap-3 rounded-[10px] bg-[#DBEAFE] p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden />
            <p className="text-[13px] leading-[1.5] text-[#2563EB]">
              Customers will enter this tier once they reach the specified point balance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              id="tier-name"
              label="Tier name"
              value={name}
              onChange={setName}
              placeholder="Tier name"
              error={errors.name}
              icon={<Tag className="h-4 w-4 text-[#8698bb]" aria-hidden />}
            />
            <ColorSelect value={color} onChange={setColor} />
          </div>

          <TextInput
            id="tier-threshold"
            label="Point threshold"
            labelSrOnly
            value={threshold}
            onChange={setThreshold}
            placeholder="0"
            inputMode="numeric"
            suffix="point(s)"
            error={errors.threshold}
          />

          <TextInput
            id="tier-multiplier"
            label="Points multiplier"
            value={multiplier}
            onChange={setMultiplier}
            placeholder="1"
            inputMode="decimal"
            suffix="x"
            error={errors.multiplier}
          />

          <div>
            <p className="text-[14px] font-medium text-[#0a152f]">Tier Benefits</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {Array.from(new Set<string>([...BENEFIT_OPTIONS, ...benefits])).map((b) => {
                const checked = benefits.includes(b);
                return (
                  <label
                    key={b}
                    className="flex cursor-pointer items-center gap-2 text-[14px] text-[#0a152f]"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition ${
                        checked ? "border-[#44b678] bg-[#44b678]" : "border-[#d4d4d4] bg-white"
                      }`}
                      aria-hidden
                    >
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleBenefit(b)}
                    />
                    {b}
                  </label>
                );
              })}
            </div>
          </div>

          <TextInput
            id="tier-bonus"
            label="Bonus Percentage"
            value={bonusPct}
            onChange={setBonusPct}
            placeholder="0"
            inputMode="decimal"
            suffix="%"
            error={errors.bonusPct}
          />

          <div className="-mx-6 border-t border-[#eef1f7]" />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="rounded-full bg-[#eef1f7] px-6 py-3 text-sm font-semibold text-[#0a152f] transition hover:bg-[#e0e6f2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Tier"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TextInput({
  id,
  label,
  labelSrOnly,
  value,
  onChange,
  placeholder,
  inputMode,
  suffix,
  icon,
  error,
}: {
  id: string;
  label: string;
  labelSrOnly?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  suffix?: string;
  icon?: React.ReactNode;
  error?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label
        htmlFor={id}
        className={labelSrOnly ? "sr-only" : "block text-[14px] font-medium text-[#0a152f]"}
      >
        {label}
      </label>
      <div
        className={`${labelSrOnly ? "" : "mt-2"} flex items-center rounded-[10px] bg-[#fafafa] px-3 py-3 ring-1 transition focus-within:ring-2 focus-within:ring-[#feb602] ${
          error ? "ring-red-400" : "ring-[#eef1f7]"
        }`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className="w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
        {suffix && (
          <>
            <span aria-hidden className="mx-2 h-4 w-px bg-[#d7ddea]" />
            <span className="text-[14px] text-[#737373]" aria-hidden>
              {suffix}
            </span>
          </>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor="tier-color" className="sr-only">
        Tier color
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="tier-color"
          className="h-[50px] rounded-[10px] border-0 bg-[#fafafa] px-3 py-3 text-[14px] text-[#0a152f] ring-1 ring-[#eef1f7] focus:ring-2 focus:ring-[#feb602] focus:ring-offset-0"
        >
          <SelectValue placeholder="Tier Color" />
        </SelectTrigger>
        <SelectContent>
          {COLOR_OPTIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.swatch }}
                  aria-hidden
                />
                {c.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
