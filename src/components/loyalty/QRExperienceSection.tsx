import * as React from "react";
import { toast } from "sonner";
import { Loader2, Upload, Image as ImageIcon, X } from "lucide-react";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StampCardPreviewCompact, rewardLabel } from "@/components/loyalty/StampCardPreview";

type FormFields = {
  first_name: { enabled: boolean; required: boolean };
  last_name: { enabled: boolean; required: boolean };
  email: { enabled: boolean; required: boolean };
  phone: { enabled: boolean; required: boolean };
  birthday: { enabled: boolean; required: boolean };
  gender: { enabled: boolean; required: boolean };
  city: { enabled: boolean; required: boolean };
  custom_field: { enabled: boolean; required: boolean };
};

type Settings = {
  id?: string;
  loyalty_program_id: string;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  business_name_override: string | null;
  welcome_headline: string | null;
  short_description: string | null;
  form_fields: FormFields;
  custom_field_label: string | null;
  show_welcome_message: boolean;
  show_rewards_preview: boolean;
  show_program_description: boolean;
  show_referral_section: boolean;
  show_terms: boolean;
  button_color: string;
  button_text: string;
  button_text_color: string;
};

const FIELD_KEYS: (keyof FormFields)[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "birthday",
  "gender",
  "city",
  "custom_field",
];
const FIELD_LABELS: Record<keyof FormFields, string> = {
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone: "Phone",
  birthday: "Birthday",
  gender: "Gender",
  city: "City",
  custom_field: "Custom field",
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

function makeInitial(programId: string): Settings {
  return {
    loyalty_program_id: programId,
    logo_url: null,
    cover_image_url: null,
    primary_color: DEFAULTS.primary_color,
    secondary_color: DEFAULTS.secondary_color,
    background_color: DEFAULTS.background_color,
    business_name_override: "",
    welcome_headline: "",
    short_description: "",
    form_fields: DEFAULT_FIELDS,
    custom_field_label: "",
    show_welcome_message: true,
    show_rewards_preview: true,
    show_program_description: true,
    show_referral_section: true,
    show_terms: true,
    button_color: DEFAULTS.button_color,
    button_text: DEFAULTS.button_text,
    button_text_color: DEFAULTS.button_text_color,
  };
}

export type QRProgramConfig = {
  program_type: "points" | "visit" | "tier";
  spend_amount: number;
  points_earned: number;
  visits_required: number;
  reward_on_completion: string | null;
  business_name: string;
};

type Props = {
  programId: string | null;
  ensureProgramSaved: () => Promise<string | null>;
  programConfig?: QRProgramConfig;
};

export function QRExperienceSection({ programId, ensureProgramSaved, programConfig }: Props) {
  const { user } = useAuth();
  const [state, setState] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<null | "branding" | "fields" | "content" | "buttons">(
    null,
  );
  const [uploading, setUploading] = React.useState<null | "logo" | "cover">(null);

  const load = React.useCallback(async () => {
    if (!programId) {
      setState(null);
      return;
    }
    setLoading(true);
    const { data, error } = await getAuthSupabase()
      .from("qr_page_settings")
      .select("*")
      .eq("loyalty_program_id", programId)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error("Couldn't load QR settings");
      return;
    }
    if (!data) {
      setState(makeInitial(programId));
      return;
    }
    const ff = (data.form_fields ?? {}) as Partial<FormFields>;
    const merged: FormFields = { ...DEFAULT_FIELDS };
    for (const k of FIELD_KEYS) {
      const v = ff[k];
      if (v && typeof v === "object") merged[k] = { enabled: !!v.enabled, required: !!v.required };
    }
    setState({
      id: data.id,
      loyalty_program_id: data.loyalty_program_id,
      logo_url: data.logo_url,
      cover_image_url: data.cover_image_url,
      primary_color: data.primary_color ?? DEFAULTS.primary_color,
      secondary_color: data.secondary_color ?? DEFAULTS.secondary_color,
      background_color: data.background_color ?? DEFAULTS.background_color,
      business_name_override: data.business_name_override ?? "",
      welcome_headline: data.welcome_headline ?? "",
      short_description: data.short_description ?? "",
      form_fields: merged,
      custom_field_label: data.custom_field_label ?? "",
      show_welcome_message: data.show_welcome_message ?? true,
      show_rewards_preview: data.show_rewards_preview ?? true,
      show_program_description: data.show_program_description ?? true,
      show_referral_section: data.show_referral_section ?? true,
      show_terms: data.show_terms ?? true,
      button_color: data.button_color ?? DEFAULTS.button_color,
      button_text: data.button_text ?? DEFAULTS.button_text,
      button_text_color: data.button_text_color ?? DEFAULTS.button_text_color,
    });
  }, [programId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function patch(next: Partial<Settings>) {
    setState((s) => (s ? { ...s, ...next } : s));
  }
  function patchField(key: keyof FormFields, next: Partial<FormFields[keyof FormFields]>) {
    setState((s) =>
      s
        ? {
            ...s,
            form_fields: {
              ...s.form_fields,
              [key]: { ...s.form_fields[key], ...next },
            },
          }
        : s,
    );
  }

  async function saveSection(
    key: "branding" | "fields" | "content" | "buttons",
    payload: Partial<Settings>,
  ) {
    const pid = programId ?? (await ensureProgramSaved());
    if (!pid) {
      toast.error("Save the program details first");
      return;
    }
    setSaving(key);
    const { data, error } = await getAuthSupabase()
      .from("qr_page_settings")
      .upsert({ loyalty_program_id: pid, ...payload }, { onConflict: "loyalty_program_id" })
      .select("id")
      .single();
    setSaving(null);
    if (error) {
      toast.error(error.message || "Could not save");
      return;
    }
    setState((s) => (s ? { ...s, id: data?.id ?? s.id } : s));
    toast.success("Saved");
  }

  async function handleUpload(kind: "logo" | "cover", file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(kind);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await getAuthSupabase()
        .storage.from("qr-branding")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await getAuthSupabase()
        .storage.from("qr-branding")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr || !signed) throw signErr ?? new Error("Could not sign URL");
      const url = signed.signedUrl;
      patch(kind === "logo" ? { logo_url: url } : { cover_image_url: url });
      await saveSection("branding", kind === "logo" ? { logo_url: url } : { cover_image_url: url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(null);
    }
  }

  if (!programId && !state) {
    return (
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <h2 className="text-[16px] font-semibold text-[#0a152f]">QR Experience</h2>
        <p className="mt-2 text-[14px] text-[#737373]">
          Save your loyalty program first to customise the customer join page.
        </p>
      </section>
    );
  }

  if (loading || !state) {
    return (
      <section className="flex items-center justify-center rounded-[16px] bg-white p-10 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <Loader2 className="h-5 w-5 animate-spin text-[#8698bb]" />
      </section>
    );
  }

  const s = state;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
        <div className="mb-4">
          <h2 className="text-[16px] font-semibold text-[#0a152f]">QR Experience</h2>
          <p className="mt-1 text-[14px] text-[#737373]">
            Customize what customers see when they scan your QR code to join.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={["branding"]} className="w-full">
          {/* BRANDING */}
          <AccordionItem value="branding" className="border-[#eef1f7]">
            <AccordionTrigger className="text-[14px] font-semibold text-[#0a152f] hover:no-underline">
              Branding
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid gap-5">
                <ImageField
                  label="Logo"
                  url={s.logo_url}
                  uploading={uploading === "logo"}
                  onFile={(f) => handleUpload("logo", f)}
                  onClear={async () => {
                    patch({ logo_url: null });
                    await saveSection("branding", { logo_url: null });
                  }}
                />
                <ImageField
                  label="Cover image (optional)"
                  url={s.cover_image_url}
                  uploading={uploading === "cover"}
                  onFile={(f) => handleUpload("cover", f)}
                  onClear={async () => {
                    patch({ cover_image_url: null });
                    await saveSection("branding", { cover_image_url: null });
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <ColorField
                    label="Primary color"
                    value={s.primary_color}
                    onChange={(v) => patch({ primary_color: v })}
                  />
                  <ColorField
                    label="Secondary color"
                    value={s.secondary_color}
                    onChange={(v) => patch({ secondary_color: v })}
                  />
                  <ColorField
                    label="Background color"
                    value={s.background_color}
                    onChange={(v) => patch({ background_color: v })}
                  />
                </div>

                <SaveRow
                  saving={saving === "branding"}
                  onSave={() =>
                    saveSection("branding", {
                      primary_color: s.primary_color,
                      secondary_color: s.secondary_color,
                      background_color: s.background_color,
                      logo_url: s.logo_url,
                      cover_image_url: s.cover_image_url,
                    })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FORM FIELDS */}
          <AccordionItem value="fields" className="border-[#eef1f7]">
            <AccordionTrigger className="text-[14px] font-semibold text-[#0a152f] hover:no-underline">
              Form fields
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="overflow-hidden rounded-[10px] ring-1 ring-[#eef1f7]">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-[#fafafa] px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-[#8698bb]">
                  <span>Field</span>
                  <span className="w-20 text-center">Show</span>
                  <span className="w-20 text-center">Required</span>
                </div>
                {FIELD_KEYS.map((k) => {
                  const f = s.form_fields[k];
                  return (
                    <div
                      key={k}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-[#eef1f7] px-4 py-3"
                    >
                      <div>
                        <p className="text-[14px] font-medium text-[#0a152f]">{FIELD_LABELS[k]}</p>
                        {k === "custom_field" && f.enabled ? (
                          <input
                            type="text"
                            value={s.custom_field_label ?? ""}
                            onChange={(e) => patch({ custom_field_label: e.target.value })}
                            placeholder="Custom field label"
                            className="mt-2 w-full max-w-xs rounded-[8px] bg-[#fafafa] px-3 py-2 text-[13px] text-[#0a152f] ring-1 ring-[#eef1f7] focus:outline-none focus:ring-2 focus:ring-[#feb602]"
                          />
                        ) : null}
                      </div>
                      <div className="flex w-20 justify-center">
                        <Toggle
                          checked={f.enabled}
                          onChange={(v) =>
                            patchField(k, { enabled: v, required: v ? f.required : false })
                          }
                          label={`Show ${FIELD_LABELS[k]}`}
                        />
                      </div>
                      <div className="flex w-20 justify-center">
                        <Toggle
                          checked={f.required}
                          disabled={!f.enabled}
                          onChange={(v) => patchField(k, { required: v })}
                          label={`Require ${FIELD_LABELS[k]}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <SaveRow
                  saving={saving === "fields"}
                  onSave={() =>
                    saveSection("fields", {
                      form_fields: s.form_fields,
                      custom_field_label: s.custom_field_label,
                    })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* CONTENT */}
          <AccordionItem value="content" className="border-[#eef1f7]">
            <AccordionTrigger className="text-[14px] font-semibold text-[#0a152f] hover:no-underline">
              Content
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid gap-4">
                <TextField
                  label="Business name override"
                  value={s.business_name_override ?? ""}
                  onChange={(v) => patch({ business_name_override: v })}
                  placeholder="Leave blank to use your account name"
                />
                <TextField
                  label="Welcome headline"
                  value={s.welcome_headline ?? ""}
                  onChange={(v) => patch({ welcome_headline: v })}
                  placeholder="Welcome to our loyalty program!"
                />
                <TextAreaField
                  label="Short description"
                  value={s.short_description ?? ""}
                  onChange={(v) => patch({ short_description: v })}
                  placeholder="Tell customers what to expect."
                />

                <div className="mt-2 grid gap-3 rounded-[10px] bg-[#fafafa] p-4 ring-1 ring-[#eef1f7]">
                  <ToggleRow
                    title="Show welcome message"
                    checked={s.show_welcome_message}
                    onChange={(v) => patch({ show_welcome_message: v })}
                  />
                  <ToggleRow
                    title="Show rewards preview"
                    checked={s.show_rewards_preview}
                    onChange={(v) => patch({ show_rewards_preview: v })}
                  />
                  <ToggleRow
                    title="Show program description"
                    checked={s.show_program_description}
                    onChange={(v) => patch({ show_program_description: v })}
                  />
                  <ToggleRow
                    title="Show referral section"
                    checked={s.show_referral_section}
                    onChange={(v) => patch({ show_referral_section: v })}
                  />
                  <ToggleRow
                    title="Show terms"
                    checked={s.show_terms}
                    onChange={(v) => patch({ show_terms: v })}
                  />
                </div>

                <SaveRow
                  saving={saving === "content"}
                  onSave={() =>
                    saveSection("content", {
                      business_name_override: s.business_name_override,
                      welcome_headline: s.welcome_headline,
                      short_description: s.short_description,
                      show_welcome_message: s.show_welcome_message,
                      show_rewards_preview: s.show_rewards_preview,
                      show_program_description: s.show_program_description,
                      show_referral_section: s.show_referral_section,
                      show_terms: s.show_terms,
                    })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* BUTTONS */}
          <AccordionItem value="buttons" className="border-b-0 border-[#eef1f7]">
            <AccordionTrigger className="text-[14px] font-semibold text-[#0a152f] hover:no-underline">
              Buttons
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <ColorField
                  label="Button color"
                  value={s.button_color}
                  onChange={(v) => patch({ button_color: v })}
                />
                <ColorField
                  label="Button text color"
                  value={s.button_text_color}
                  onChange={(v) => patch({ button_text_color: v })}
                />
                <TextField
                  label="Button text"
                  value={s.button_text ?? ""}
                  onChange={(v) => patch({ button_text: v })}
                  placeholder="Join Loyalty Program"
                />
              </div>
              <p className="mt-2 text-[12px] text-[#8698bb]">
                Examples: "Join Loyalty Program", "Start Collecting Points", "Claim Your Rewards"
              </p>
              <div className="mt-4">
                <SaveRow
                  saving={saving === "buttons"}
                  onSave={() =>
                    saveSection("buttons", {
                      button_color: s.button_color,
                      button_text: s.button_text,
                      button_text_color: s.button_text_color,
                    })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <JoinPreview s={s} programConfig={programConfig} />
      </aside>
    </div>
  );
}

/* ---------- helpers ---------- */

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-[10px] bg-[#feb602] px-4 py-2 text-[14px] font-semibold text-[#0A152F] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save changes
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#0a152f]">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-[10px] bg-[#fafafa] px-3 py-3 text-[14px] text-[#0a152f] ring-1 ring-[#eef1f7] focus:outline-none focus:ring-2 focus:ring-[#feb602]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#0a152f]">{label}</label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full resize-y rounded-[10px] bg-[#fafafa] px-3 py-3 text-[14px] text-[#0a152f] ring-1 ring-[#eef1f7] focus:outline-none focus:ring-2 focus:ring-[#feb602]"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#([0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#0a152f]">{label}</label>
      <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-[#fafafa] px-3 py-2 ring-1 ring-[#eef1f7] focus-within:ring-2 focus-within:ring-[#feb602]">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-8 w-10 cursor-pointer rounded border border-[#eef1f7] bg-transparent p-0"
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full bg-transparent text-[14px] text-[#0a152f] focus:outline-none"
        />
      </div>
    </div>
  );
}

function ImageField({
  label,
  url,
  uploading,
  onFile,
  onClear,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-[14px] font-medium text-[#0a152f]">{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[10px] bg-[#fafafa] ring-1 ring-[#eef1f7]">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#8698bb]" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#feb602] px-3 py-2 text-[13px] font-semibold text-[#0A152F] hover:brightness-95 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {url ? "Replace" : "Upload"}
          </button>
          {url ? (
            <button
              type="button"
              onClick={onClear}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-medium text-[#0a152f] ring-1 ring-[#eef1f7] hover:bg-[#fafafa] disabled:opacity-60"
            >
              <X className="h-4 w-4" /> Remove
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
      </div>
      <p className="mt-1.5 text-[12px] text-[#737373]">PNG or JPG up to 5MB.</p>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
        checked ? "bg-[#44b678]" : "bg-[#d7ddea]"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[14px] font-medium text-[#0a152f]">{title}</p>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/* ---------- live preview ---------- */

function JoinPreview({ s, programConfig }: { s: Settings; programConfig?: QRProgramConfig }) {
  const enabledFields = FIELD_KEYS.filter((k) => s.form_fields[k].enabled);
  const businessName = (s.business_name_override || "").trim() || "Your business";
  const headline = (s.welcome_headline || "").trim() || "Welcome!";
  const description =
    (s.short_description || "").trim() ||
    "Join our loyalty program to earn rewards on every visit.";

  return (
    <div className="rounded-[16px] bg-white p-4 shadow-[0_1px_3px_rgba(10,13,18,0.1)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#0a152f]">Live preview</h3>
        <span className="text-[11px] uppercase tracking-wide text-[#8698bb]">Not saved yet</span>
      </div>

      {/* Phone frame */}
      <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[24px] bg-[#0a152f] p-2 shadow-inner">
        <div
          className="max-h-[560px] overflow-y-auto rounded-[18px]"
          style={{ backgroundColor: s.background_color || "#FFFFFF" }}
        >
          {/* Cover */}
          {s.cover_image_url ? (
            <div className="h-24 w-full overflow-hidden">
              <img src={s.cover_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className="h-12 w-full"
              style={{ backgroundColor: s.primary_color || "#FEB602" }}
            />
          )}

          <div className="px-4 pb-4 pt-3">
            {/* Logo + name */}
            <div className="-mt-8 flex items-center gap-3">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-4"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
              >
                {s.logo_url ? (
                  <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span
                    className="text-[18px] font-bold"
                    style={{ color: s.primary_color || "#FEB602" }}
                  >
                    {businessName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="min-w-0 truncate pt-2 text-[13px] font-semibold text-[#0a152f]">
                {businessName}
              </p>
            </div>

            {/* Welcome */}
            {s.show_welcome_message ? (
              <div className="mt-4">
                <h4 className="text-[16px] font-bold text-[#0a152f]">{headline}</h4>
              </div>
            ) : null}

            {/* Description */}
            {s.show_program_description ? (
              <p className="mt-2 text-[12px] leading-[1.5] text-[#525252]">{description}</p>
            ) : null}

            {/* Rewards preview — reflects the actual program type */}
            {s.show_rewards_preview ? (
              <div className="mt-3">
                <RewardsPreviewMini s={s} programConfig={programConfig} />
              </div>
            ) : null}

            {/* Form fields */}
            {enabledFields.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {enabledFields.map((k) => {
                  const cfg = s.form_fields[k];
                  const label =
                    k === "custom_field"
                      ? (s.custom_field_label || "Custom field").trim() || "Custom field"
                      : FIELD_LABELS[k];
                  return (
                    <div key={k}>
                      <label className="block text-[11px] font-medium text-[#0a152f]">
                        {label}
                        {cfg.required ? (
                          <span style={{ color: s.primary_color || "#FEB602" }}> *</span>
                        ) : null}
                      </label>
                      <div
                        aria-hidden
                        className="mt-1 h-8 w-full rounded-[8px] bg-[#f4f6fb] ring-1 ring-[#eef1f7]"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Referral */}
            {s.show_referral_section ? (
              <div
                className="mt-4 rounded-[10px] border border-dashed p-3"
                style={{ borderColor: s.secondary_color || "#44B678" }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: s.secondary_color || "#44B678" }}
                >
                  Refer a friend
                </p>
                <p className="mt-1 text-[11px] text-[#525252]">
                  Earn bonus points when friends join and check in.
                </p>
              </div>
            ) : null}

            {/* Button */}
            <button
              type="button"
              disabled
              className="mt-4 w-full rounded-[10px] py-2.5 text-[13px] font-semibold"
              style={{
                backgroundColor: s.button_color || "#FEB602",
                color: s.button_text_color || "#0A152F",
              }}
            >
              {(s.button_text || "").trim() || "Join Loyalty Program"}
            </button>

            {/* Terms */}
            {s.show_terms ? (
              <p className="mt-3 text-center text-[10px] leading-[1.5] text-[#8698bb]">
                By joining, you agree to the program's terms and privacy policy.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardsPreviewMini({
  s,
  programConfig,
}: {
  s: Settings;
  programConfig?: QRProgramConfig;
}) {
  const accent = s.primary_color || "#FEB602";
  const businessName =
    (s.business_name_override || "").trim() || programConfig?.business_name || "Your business";

  if (programConfig?.program_type === "visit") {
    return (
      <StampCardPreviewCompact
        businessName={businessName}
        visitsRequired={programConfig.visits_required || 0}
        rewardDescription={rewardLabel(programConfig.reward_on_completion) || "Your reward"}
        accentColor={accent}
      />
    );
  }

  if (programConfig?.program_type === "points") {
    const spend = programConfig.spend_amount || 0;
    const pts = programConfig.points_earned || 0;
    return (
      <div className="rounded-[10px] p-3" style={{ backgroundColor: accent + "20" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0a152f]">
          Rewards preview
        </p>
        <p className="mt-1 text-[12px] text-[#0a152f]">
          {spend > 0 && pts > 0
            ? `Spend $${spend}, earn ${pts} ${pts === 1 ? "point" : "points"}`
            : "Set spend and points to preview your rewards."}
        </p>
      </div>
    );
  }

  // tier / unknown — generic fallback
  return (
    <div className="rounded-[10px] p-3" style={{ backgroundColor: accent + "20" }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0a152f]">
        Rewards preview
      </p>
      <p className="mt-1 text-[12px] text-[#525252]">
        Unlock rewards as you progress through tiers.
      </p>
    </div>
  );
}
