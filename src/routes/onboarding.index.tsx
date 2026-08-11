import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { MapPin, MapPinned, Globe, Users, Receipt, ChevronDown } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingLeftPanelDecor } from "@/components/onboarding/OnboardingLeftPanelDecor";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Set up your account — Loyalty" },
      {
        name: "description",
        content: "Tell us more about your business to personalize your loyalty program.",
      },
      { property: "og:title", content: "Set up your account — Loyalty" },
      {
        property: "og:description",
        content: "Tell us more about your business to personalize your loyalty program.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingBusinessInfo,
});

const TOTAL_STEPS = 4;
const CURRENT_STEP = 1;

const schema = z.object({
  num_locations: z.string().min(1, "Select a number of locations"),
  main_location: z.string().trim().min(1, "Enter your main business location").max(120),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((v) => !v || /^(https?:\/\/)?[^\s]+\.[^\s]+$/.test(v), "Enter a valid website URL"),
  avg_customers_per_day: z.string().min(1, "Select an average"),
  avg_cheque_per_day: z
    .string()
    .trim()
    .min(1, "Enter an average cheque")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Enter a number"),
  cheque_currency: z.string().min(1),
});

type FormState = z.infer<typeof schema>;

const LOCATION_OPTIONS = ["1", "2-5", "6-10", "11-25", "26-50", "50+"];
const CUSTOMER_OPTIONS = ["<50", "50-100", "100-250", "250-500", "500-1000", "1000+"];
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "AED", "SAR"];

function OnboardingBusinessInfo() {
  const navigate = useNavigate();
  const { user, isVerified, loading } = useAuth();

  const [form, setForm] = React.useState<FormState>({
    num_locations: "",
    main_location: "",
    website: "",
    avg_customers_per_day: "",
    avg_cheque_per_day: "",
    cheque_currency: "USD",
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  // Session gate + onboarding-completed check
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
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "onboarding_completed, num_locations, main_location, website, avg_customers_per_day, avg_cheque_per_day, cheque_currency",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      if (data) {
        setForm((prev) => ({
          num_locations: data.num_locations ?? prev.num_locations,
          main_location: data.main_location ?? prev.main_location,
          website: data.website ?? prev.website,
          avg_customers_per_day: data.avg_customers_per_day ?? prev.avg_customers_per_day,
          avg_cheque_per_day:
            data.avg_cheque_per_day != null
              ? String(data.avg_cheque_per_day)
              : prev.avg_cheque_per_day,
          cheque_currency: data.cheque_currency ?? prev.cheque_currency,
        }));
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate]);

  const isValid = React.useMemo(() => schema.safeParse(form).success, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (!user) return;
    setSaving(true);
    // Use upsert (not update) so that the profile row is created if the
    // auth-trigger that normally seeds it hasn't run. Without this, an update
    // silently affects 0 rows, Step 2's guard sees no `num_locations`, and
    // bounces the user back to Step 1.
    // Also carry forward the signup metadata (full_name, business_name, phone)
    // so if this upsert is the row's first INSERT, those fields aren't
    // silently created as NULL and lost from the Settings page later.
    // Only include those keys when the metadata is a non-empty string so we
    // never overwrite an existing value with NULL on a repeat visit.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const seed: Record<string, unknown> = {};
    if (typeof meta.full_name === "string" && meta.full_name.trim()) {
      seed.full_name = meta.full_name;
    }
    if (typeof meta.business_name === "string" && meta.business_name.trim()) {
      seed.business_name = meta.business_name;
    }
    if (typeof meta.phone === "string" && meta.phone.trim()) {
      seed.phone = meta.phone;
    }
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        ...seed,
        num_locations: parsed.data.num_locations,
        main_location: parsed.data.main_location,
        website: parsed.data.website || null,
        avg_customers_per_day: parsed.data.avg_customers_per_day,
        avg_cheque_per_day: Number(parsed.data.avg_cheque_per_day),
        cheque_currency: parsed.data.cheque_currency,
      },
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) {
      console.error("[onboarding step 1] save failed", error);
      setSubmitError(error.message || "Could not save. Please try again.");
      return;
    }
    // Advance to Step 2 — Business Type.
    navigate({ to: "/onboarding/business-type" });
  }

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f7] p-2 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden rounded-[40px] bg-[#eef1f7] lg:min-h-[calc(100vh-3rem)] lg:flex-row lg:p-8">
        {/* Left panel */}
        <aside className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-[32px] bg-[#0a152f] p-5 text-white lg:h-auto lg:w-[320px] lg:rounded-[40px] lg:p-7">
          <OnboardingLeftPanelDecor />

          <div className="relative flex items-center justify-center rounded-full bg-[#0f1c3d] px-10 py-5">
            <span className="text-base font-semibold leading-none text-[#feb602]">LOGO</span>
          </div>

          <div className="relative flex w-full flex-col items-center gap-4 text-center">
            <h2 className="text-[24px] font-bold leading-[1.2] text-white">
              Let&rsquo;s Setup Your Account
            </h2>
            <p className="text-base font-normal text-[#eef1f7]">
              Just a few quick steps to personalize your experience and launch your loyalty program.
            </p>
          </div>
        </aside>

        {/* Right panel */}
        <section className="flex min-w-0 flex-1 flex-col justify-center gap-8 px-5 py-8 lg:px-12 lg:py-0">
          <div className="flex flex-1 flex-col justify-center gap-8">
            {/* Progress */}
            <div
              role="progressbar"
              aria-label={`Step ${CURRENT_STEP} of ${TOTAL_STEPS}`}
              aria-valuemin={1}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={CURRENT_STEP}
              className="flex items-center gap-2"
            >
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                const active = i === CURRENT_STEP - 1;
                return (
                  <span
                    key={i}
                    className={
                      active
                        ? "h-2 w-8 rounded-full bg-[#feb602]"
                        : "h-2 w-2 rounded-full bg-[#d7ddea]"
                    }
                  />
                );
              })}
            </div>

            <h1 className="text-[24px] font-bold leading-[1.2] text-[#0a152f]">
              Tell Us More About Your Business
            </h1>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8" noValidate>
              <div className="flex flex-col gap-4">
                {/* Row 1: Locations + Main Location */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <SelectField
                    id="num_locations"
                    label="Number of Locations"
                    icon={<MapPinned className="h-4 w-4" />}
                    value={form.num_locations}
                    onChange={(v) => setForm((f) => ({ ...f, num_locations: v }))}
                    options={LOCATION_OPTIONS}
                    error={errors.num_locations}
                  />
                  <TextField
                    id="main_location"
                    label="Business main Location"
                    placeholder="Business main Location"
                    icon={<MapPin className="h-4 w-4" />}
                    value={form.main_location}
                    onChange={(v) => setForm((f) => ({ ...f, main_location: v }))}
                    error={errors.main_location}
                  />
                </div>

                {/* Row 2: Website */}
                <TextField
                  id="website"
                  label="Business Website"
                  placeholder="Business Website"
                  icon={<Globe className="h-4 w-4" />}
                  value={form.website ?? ""}
                  onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                  error={errors.website}
                  fullWidth
                />

                {/* Row 3: Customers + Cheque */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <SelectField
                    id="avg_customers_per_day"
                    label="Average Customers Per Day"
                    icon={<Users className="h-4 w-4" />}
                    value={form.avg_customers_per_day}
                    onChange={(v) => setForm((f) => ({ ...f, avg_customers_per_day: v }))}
                    options={CUSTOMER_OPTIONS}
                    error={errors.avg_customers_per_day}
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <label htmlFor="avg_cheque_per_day" className="sr-only">
                      Average Cheque Per Day
                    </label>
                    <div
                      className={
                        "flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 " +
                        (errors.avg_cheque_per_day ? "border-red-500" : "border-[#d7ddea]")
                      }
                    >
                      <Receipt className="h-4 w-4 text-[#a3a3a3]" aria-hidden />
                      <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
                      <input
                        id="avg_cheque_per_day"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="Average Cheque Per Day"
                        value={form.avg_cheque_per_day}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, avg_cheque_per_day: e.target.value }))
                        }
                        aria-invalid={!!errors.avg_cheque_per_day}
                        aria-describedby={
                          errors.avg_cheque_per_day ? "avg_cheque_per_day-err" : undefined
                        }
                        className="min-w-0 flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
                      />
                      <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
                      <div className="relative flex items-center">
                        <label htmlFor="cheque_currency" className="sr-only">
                          Currency
                        </label>
                        <select
                          id="cheque_currency"
                          value={form.cheque_currency}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, cheque_currency: e.target.value }))
                          }
                          className="appearance-none bg-transparent pr-5 text-base font-normal text-[#0a152f] focus:outline-none"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-0 h-4 w-4 text-[#0a152f]"
                          aria-hidden
                        />
                      </div>
                    </div>
                    {errors.avg_cheque_per_day && (
                      <p id="avg_cheque_per_day-err" className="text-sm text-red-600">
                        {errors.avg_cheque_per_day}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <p role="alert" className="text-sm text-red-600">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={!isValid || saving}
                  className={
                    "inline-flex items-center justify-center gap-1 rounded-full px-10 py-2 text-[20px] font-semibold shadow-[0_1px_8px_0_rgba(0,0,0,0.12)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f7] " +
                    (!isValid || saving
                      ? "cursor-not-allowed bg-[#ffe48a] text-[#e29f00] opacity-60"
                      : "bg-[#feb602] text-white hover:bg-[#e29f00]")
                  }
                >
                  <span className="min-h-[36px] leading-9">{saving ? "Saving…" : "Next"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-center py-2">
            <p className="text-base text-[#737373]">*Your data stays private and encrypted.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Field primitives ---------- */

type TextFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  fullWidth?: boolean;
};

function TextField({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
  error,
  fullWidth,
}: TextFieldProps) {
  return (
    <div className={fullWidth ? "flex w-full flex-col gap-1" : "flex flex-1 flex-col gap-1"}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={
          "flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 " +
          (error ? "border-red-500" : "border-[#d7ddea]")
        }
      >
        <span className="text-[#a3a3a3]">{icon}</span>
        <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 bg-transparent text-base text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
      </div>
      {error && (
        <p id={`${id}-err`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
};

function SelectField({ id, label, icon, value, onChange, options, error }: SelectFieldProps) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={
          "relative flex h-[53px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-4 " +
          (error ? "border-red-500" : "border-[#d7ddea]")
        }
      >
        <span className="text-[#a3a3a3]">{icon}</span>
        <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={
            "min-w-0 flex-1 appearance-none bg-transparent pr-6 text-base focus:outline-none " +
            (value ? "text-[#0a152f]" : "text-[#a3a3a3]")
          }
        >
          <option value="" disabled>
            {label}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 h-4 w-4 text-[#0a152f]"
          aria-hidden
        />
      </div>
      {error && (
        <p id={`${id}-err`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
