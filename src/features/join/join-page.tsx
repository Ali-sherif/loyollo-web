"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrollCustomer, getJoinProgram, type EnrollResult } from "@/lib/client/join-api";
import { StampCardPreviewCompact, rewardLabel } from "@/components/loyalty/StampCardPreview";

type FieldConfig = { enabled: boolean; required: boolean };
type FormFields = {
  first_name: FieldConfig;
  last_name: FieldConfig;
  email: FieldConfig;
  phone: FieldConfig;
  birthday: FieldConfig;
  gender: FieldConfig;
  city: FieldConfig;
  custom_field: FieldConfig;
};

const DEFAULT_FIELDS: FormFields = {
  first_name: { enabled: true, required: true },
  last_name: { enabled: true, required: false },
  email: { enabled: true, required: true },
  phone: { enabled: true, required: false },
  birthday: { enabled: false, required: false },
  gender: { enabled: false, required: false },
  city: { enabled: false, required: false },
  custom_field: { enabled: false, required: false },
};

const DEFAULTS = {
  primary_color: "#FEB602",
  secondary_color: "#44B678",
  background_color: "#FFFFFF",
  button_color: "#FEB602",
  button_text: "Join Loyalty Program",
  button_text_color: "#0A152F",
};

type Applied = {
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  business_name_override: string | null;
  welcome_headline: string;
  short_description: string;
  form_fields: FormFields;
  custom_field_label: string;
  show_welcome_message: boolean;
  show_rewards_preview: boolean;
  show_program_description: boolean;
  show_referral_section: boolean;
  show_terms: boolean;
  button_color: string;
  button_text: string;
  button_text_color: string;
};

function mergeSettings(qr: Record<string, unknown> | null, brand: string): Applied {
  const raw = (qr?.form_fields ?? {}) as Partial<FormFields>;
  const form_fields: FormFields = { ...DEFAULT_FIELDS };
  for (const k of Object.keys(DEFAULT_FIELDS) as (keyof FormFields)[]) {
    const v = raw[k];
    if (v && typeof v === "object") {
      form_fields[k] = { enabled: !!v.enabled, required: !!v.required };
    }
  }
  const str = (v: unknown, fb: string) => (typeof v === "string" && v.trim().length > 0 ? v : fb);
  const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);
  return {
    logo_url: (qr?.logo_url as string | null) ?? null,
    cover_image_url: (qr?.cover_image_url as string | null) ?? null,
    primary_color: str(qr?.primary_color, DEFAULTS.primary_color),
    secondary_color: str(qr?.secondary_color, DEFAULTS.secondary_color),
    background_color: str(qr?.background_color, DEFAULTS.background_color),
    business_name_override: (qr?.business_name_override as string | null) ?? null,
    welcome_headline: str(qr?.welcome_headline, `Join ${brand}'s loyalty program`),
    short_description: str(
      qr?.short_description,
      "Sign up in seconds to start earning rewards on every visit.",
    ),
    form_fields,
    custom_field_label: str(qr?.custom_field_label, "Custom field"),
    show_welcome_message: bool(qr?.show_welcome_message, true),
    show_rewards_preview: bool(qr?.show_rewards_preview, true),
    show_program_description: bool(qr?.show_program_description, true),
    show_referral_section: bool(qr?.show_referral_section, true),
    show_terms: bool(qr?.show_terms, true),
    button_color: str(qr?.button_color, DEFAULTS.button_color),
    button_text: str(qr?.button_text, DEFAULTS.button_text),
    button_text_color: str(qr?.button_text_color, DEFAULTS.button_text_color),
  };
}

function JoinPage({ programId }: { programId: string }) {
  /* params from props */
  const fetchProgram = getJoinProgram;
  const enrollFn = enrollCustomer;

  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["join-program", programId],
    queryFn: () => fetchProgram({ programId }),
    retry: false,
  });

  const brand =
    (
      program?.qr as { business_name_override?: string | null } | null
    )?.business_name_override?.trim() ||
    program?.businessName ||
    program?.name ||
    "this business";

  const settings = useMemo<Applied>(
    () => mergeSettings((program?.qr as Record<string, unknown> | null) ?? null, brand),
    [program?.qr, brand],
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [enrolled, setEnrolled] = useState<EnrollResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ff = settings.form_fields;
    const parts: string[] = [];
    if (ff.first_name.enabled && firstName.trim()) parts.push(firstName.trim());
    if (ff.last_name.enabled && lastName.trim()) parts.push(lastName.trim());
    const fullName = parts.join(" ").trim() || firstName.trim() || lastName.trim();
    if (!fullName) {
      toast.error("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await enrollFn({
        programId,
        fullName,
        email: ff.email.enabled ? email.trim() : "",
        phone: ff.phone.enabled ? phone.trim() : "",
        birthday: ff.birthday.enabled ? birthday.trim() : "",
        gender: ff.gender.enabled ? gender.trim() : "",
        city: ff.city.enabled ? city.trim() : "",
        customFieldValue: ff.custom_field.enabled ? customVal.trim() : "",
      });
      setEnrolled(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Shell bg={DEFAULTS.background_color}>
        <div className="flex items-center justify-center py-10 text-[#525252]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (isError || !program) {
    return (
      <Shell bg={DEFAULTS.background_color}>
        <div className="text-center">
          <h1 className="text-[22px] font-bold text-[#0a152f]">Program not found</h1>
          <p className="mt-2 text-[14px] text-[#525252]">
            This loyalty program link is invalid or has been removed.
          </p>
        </div>
      </Shell>
    );
  }

  if (enrolled) {
    const { earnedReward, progress, alreadyEnrolled, programType, message } = enrolled;
    const isVisitsProgram = programType === "visit" || programType === "tier";

    if (earnedReward) {
      return (
        <Shell bg={settings.background_color} cover={settings.cover_image_url}>
          <div className="text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${settings.primary_color}22` }}
            >
              <Gift className="h-8 w-8" style={{ color: settings.primary_color }} aria-hidden />
            </div>
            <h1 className="mt-5 text-[24px] font-bold text-[#0a152f]">Congratulations! 🎉</h1>
            <p className="mt-2 text-[15px] leading-[1.5] text-[#525252]">
              You've earned <strong className="text-[#0a152f]">{earnedReward.name}</strong> from{" "}
              {brand}.
            </p>
            <div
              className="mt-6 rounded-2xl border-2 p-5"
              style={{
                borderColor: settings.primary_color,
                backgroundColor: `${settings.primary_color}18`,
              }}
            >
              <p className="text-[12px] uppercase tracking-wide text-[#92400e]">Reward earned</p>
              <p className="mt-1 text-[20px] font-bold text-[#0a152f]">{earnedReward.name}</p>
              <p className="mt-2 text-[12px] text-[#92400e]">
                Show this screen or the confirmation email on your next visit to redeem.
              </p>
            </div>
            {message ? <p className="mt-4 text-[13px] text-[#525252]">{message}</p> : null}
          </div>
        </Shell>
      );
    }

    return (
      <Shell bg={settings.background_color} cover={settings.cover_image_url}>
        <div className="text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${settings.secondary_color}22` }}
          >
            <CheckCircle2
              className="h-7 w-7"
              style={{ color: settings.secondary_color }}
              aria-hidden
            />
          </div>
          <h1 className="mt-5 text-[22px] font-bold text-[#0a152f]">
            {alreadyEnrolled ? "Check-in confirmed!" : "You're in!"}
          </h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-[#525252]">
            {alreadyEnrolled
              ? `Thanks for coming back to ${brand}.`
              : `Thanks for joining ${brand}'s loyalty program.`}
          </p>
          <div className="mt-6 rounded-2xl bg-[#f8fafc] p-5">
            {isVisitsProgram ? (
              <>
                <p className="text-[12px] uppercase tracking-wide text-[#64748b]">Your visits</p>
                <p className="mt-1 text-[32px] font-bold text-[#0a152f]">{progress.visits}</p>
                {progress.visitsAdded ? (
                  <p className="mt-1 text-[12px]" style={{ color: settings.secondary_color }}>
                    +{progress.visitsAdded} this visit
                  </p>
                ) : alreadyEnrolled ? (
                  <p className="mt-1 text-[12px] text-[#64748b]">
                    Come back tomorrow to earn another visit
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-[#64748b]">
                    Start earning on your next visit
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[12px] uppercase tracking-wide text-[#64748b]">
                  Your points balance
                </p>
                <p className="mt-1 text-[32px] font-bold text-[#0a152f]">{progress.points}</p>
                {progress.pointsAdded ? (
                  <p className="mt-1 text-[12px]" style={{ color: settings.secondary_color }}>
                    +{progress.pointsAdded} this visit
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-[#64748b]">
                    Start earning on your next visit
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  const ff = settings.form_fields;

  return (
    <Shell bg={settings.background_color} cover={settings.cover_image_url}>
      <div className="text-center">
        {settings.logo_url ? (
          <img
            src={settings.logo_url}
            alt={`${brand} logo`}
            className="mx-auto h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0f1c3d]">
            <Sparkles className="h-6 w-6" style={{ color: settings.primary_color }} aria-hidden />
          </div>
        )}
        {settings.show_welcome_message ? (
          <h1 className="mt-5 text-[22px] font-bold text-[#0a152f]">{settings.welcome_headline}</h1>
        ) : null}
        {settings.show_program_description ? (
          <p className="mt-2 text-[14px] leading-[1.5] text-[#525252]">
            {settings.short_description}
          </p>
        ) : null}
      </div>

      {settings.show_rewards_preview ? (
        <div className="mt-6">
          {program?.config?.program_type === "visit" ? (
            <StampCardPreviewCompact
              businessName={brand}
              visitsRequired={program.config.visits_required || 0}
              rewardDescription={rewardLabel(program.config.reward_on_completion) || "Your reward"}
              accentColor={settings.primary_color}
            />
          ) : program?.config?.program_type === "points" ? (
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: `${settings.primary_color}18` }}
            >
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5" style={{ color: settings.primary_color }} aria-hidden />
                <p className="text-[13px] text-[#0a152f]">
                  {program.config.spend_amount > 0 && program.config.points_earned > 0
                    ? `Spend $${program.config.spend_amount}, earn ${program.config.points_earned} ${program.config.points_earned === 1 ? "point" : "points"}`
                    : "Earn points on every visit."}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: `${settings.primary_color}18` }}
            >
              <Gift className="h-5 w-5" style={{ color: settings.primary_color }} aria-hidden />
              <p className="text-[13px] text-[#0a152f]">Unlock rewards as you progress.</p>
            </div>
          )}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {ff.first_name.enabled ? (
          <TextField
            id="firstName"
            label="First name"
            required={ff.first_name.required}
            value={firstName}
            onChange={setFirstName}
            placeholder="Jane"
            maxLength={60}
          />
        ) : null}
        {ff.last_name.enabled ? (
          <TextField
            id="lastName"
            label="Last name"
            required={ff.last_name.required}
            value={lastName}
            onChange={setLastName}
            placeholder="Doe"
            maxLength={60}
          />
        ) : null}
        {ff.email.enabled ? (
          <TextField
            id="email"
            type="email"
            label="Email"
            required={ff.email.required}
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            maxLength={255}
          />
        ) : null}
        {ff.phone.enabled ? (
          <TextField
            id="phone"
            type="tel"
            label="Phone"
            required={ff.phone.required}
            value={phone}
            onChange={setPhone}
            placeholder="+1 555 123 4567"
            maxLength={40}
          />
        ) : null}
        {ff.birthday.enabled ? (
          <TextField
            id="birthday"
            type="date"
            label="Birthday"
            required={ff.birthday.required}
            value={birthday}
            onChange={setBirthday}
          />
        ) : null}
        {ff.gender.enabled ? (
          <div className="space-y-1.5">
            <Label htmlFor="gender">
              Gender{ff.gender.required ? <span className="text-red-500"> *</span> : null}
            </Label>
            <select
              id="gender"
              required={ff.gender.required}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        ) : null}
        {ff.city.enabled ? (
          <TextField
            id="city"
            label="City"
            required={ff.city.required}
            value={city}
            onChange={setCity}
            placeholder="Toronto"
            maxLength={120}
          />
        ) : null}
        {ff.custom_field.enabled ? (
          <TextField
            id="custom"
            label={settings.custom_field_label || "Custom field"}
            required={ff.custom_field.required}
            value={customVal}
            onChange={setCustomVal}
            maxLength={255}
          />
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-6 text-[15px] font-semibold hover:opacity-90"
          style={{
            backgroundColor: settings.button_color,
            color: settings.button_text_color,
          }}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Joining…
            </span>
          ) : (
            settings.button_text
          )}
        </Button>

        {settings.show_referral_section ? (
          <p className="text-center text-[12px] text-[#64748b]">
            Refer friends to {brand} and earn extra rewards.
          </p>
        ) : null}

        {settings.show_terms ? (
          <p className="text-center text-[11px] leading-[1.5] text-[#94a3b8]">
            By joining, you agree to receive loyalty updates from {brand}. You can unsubscribe at
            any time.
          </p>
        ) : null}
      </form>
    </Shell>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const { id, label, value, onChange, required, type = "text", placeholder, maxLength } = props;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}

function Shell({
  children,
  bg,
  cover,
}: {
  children: React.ReactNode;
  bg: string;
  cover?: string | null;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: bg }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_rgba(15,28,61,0.06)]">
        {cover ? (
          <div
            className="h-32 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${cover})` }}
          />
        ) : null}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default JoinPage;
