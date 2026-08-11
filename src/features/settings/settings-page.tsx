"use client";

import { Link, useNavigate, useRouterState } from "@/lib/navigation";
// TanStack useServerFn removed — call server modules directly from client with fetch/BFF later
import * as React from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  User,
  Building2,
  Briefcase,
  Layers,
  Mail,
  Phone,
  Globe,
  Coins,
  Upload,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { passwordFeedback } from "@/lib/password";
import { sendPasswordChangedEmail, deleteMyAccount } from "@/lib/client/security-api";

type TabKey = "general" | "notifications" | "integrations" | "billing" | "security";

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  business_category: string | null;
  business_type: string | null;
  industry: string | null;
  website: string | null;
  currency: string | null;
  avatar_url: string | null;
};

const EMPTY: ProfileRow = {
  full_name: "",
  email: "",
  phone: "",
  business_name: "",
  business_category: "",
  business_type: "",
  industry: "",
  website: "",
  currency: "",
  avatar_url: "",
};

const CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AED", "SAR"];

function SettingsPage() {
  const navigate = useNavigate();
  const { user, isVerified, loading, signOut } = useAuth();
  const [tab, setTab] = React.useState<TabKey>("general");
  const [form, setForm] = React.useState<ProfileRow>(EMPTY);
  const [initial, setInitial] = React.useState<ProfileRow>(EMPTY);
  const [fetching, setFetching] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isVerified) {
      navigate({ to: "/verify", search: { email: user.email ?? "" }, replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select(
          "full_name,email,phone,business_name,business_category,business_type,industry,website,currency,avatar_url",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const raw = (data ?? {}) as Partial<ProfileRow>;
      const merged: ProfileRow = {
        ...EMPTY,
        ...raw,
        email: raw.email ?? user.email ?? "",
        currency: raw.currency || "",
      };
      setForm(merged);
      setInitial(merged);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isVerified, loading, navigate]);

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  function update<K extends keyof ProfileRow>(k: K, v: ProfileRow[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const payload = {
      full_name: form.full_name || null,
      phone: form.phone || null,
      business_name: form.business_name || null,
      business_category: form.business_category || null,
      business_type: form.business_type || null,
      industry: form.industry || null,
      website: form.website || null,
      currency: form.currency || null,
      avatar_url: form.avatar_url || null,
    };
    const { error } = await getAuthSupabase().from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save changes");
      return;
    }
    setInitial(form);
    toast.success("Settings saved");
  }

  function handleCancel() {
    setForm(initial);
  }

  async function handleAvatarFile(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await getAuthSupabase()
        .storage.from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await getAuthSupabase()
        .storage.from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr || !signed) throw signErr ?? new Error("Could not sign URL");
      const url = signed.signedUrl;
      const { error: dbErr } = await getAuthSupabase()
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      setForm((f) => ({ ...f, avatar_url: url }));
      setInitial((f) => ({ ...f, avatar_url: url }));
      toast.success("Profile picture updated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  }

  const firstName = (form.full_name || "").trim() || "there";

  if (loading || fetching || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#feb602] border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell firstName={firstName} onSignOut={signOut}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-[#0a152f]">Settings</h1>
          <p className="mt-1 text-sm text-[#737373]">
            Manage your business information, loyalty preferences, team members, and account
            settings.
          </p>
        </div>

        {/* Tabs */}
        <div className="inline-flex w-fit items-center gap-1 rounded-[12px] bg-white p-1 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
          {(
            [
              ["general", "General"],
              ["notifications", "Notifications"],
              ["integrations", "Integrations"],
              ["billing", "Billing"],
              ["security", "Security"],
            ] as [TabKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={
                "rounded-[10px] px-5 py-2 text-sm font-semibold transition " +
                (tab === key
                  ? "bg-[#feb602] text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)]"
                  : "text-[#0a152f] hover:bg-[#eef1f7]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "general" ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              <Card title="Profile Picture">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="h-[140px] w-[140px] overflow-hidden rounded-full bg-[#eef1f7] ring-1 ring-[#d7ddea]">
                    {form.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.avatar_url}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#a3a3a3]">
                        <User className="h-14 w-14" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleAvatarFile(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-5 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00] disabled:opacity-60"
                  >
                    {uploadingAvatar ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a152f] border-t-transparent" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-[#0a152f]" /> Change image
                      </>
                    )}
                  </button>
                  {form.avatar_url && (
                    <button
                      type="button"
                      onClick={() => update("avatar_url", "")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#b71c1c] hover:underline"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  )}
                </div>
              </Card>

              <Card title="Currency">
                <Field label="">
                  <SelectInput
                    icon={<Coins className="h-4 w-4" />}
                    value={form.currency ?? ""}
                    onChange={(v) => update("currency", v)}
                    options={CURRENCIES}
                    placeholder="Select currency"
                  />
                </Field>
              </Card>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              <Card title="Basic Information">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name">
                    <TextInput
                      icon={<User className="h-4 w-4" />}
                      value={form.full_name ?? ""}
                      onChange={(v) => update("full_name", v)}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Business Name">
                    <TextInput
                      icon={<Building2 className="h-4 w-4" />}
                      value={form.business_name ?? ""}
                      onChange={(v) => update("business_name", v)}
                      placeholder="Business name"
                    />
                  </Field>
                  <Field label="Business Type">
                    <TextInput
                      icon={<Briefcase className="h-4 w-4" />}
                      value={form.business_category ?? ""}
                      onChange={(v) => update("business_category", v)}
                      placeholder="Business type"
                    />
                  </Field>
                  <Field label="Industry">
                    <TextInput
                      icon={<Layers className="h-4 w-4" />}
                      value={form.business_type ?? ""}
                      onChange={(v) => update("business_type", v)}

                      placeholder="Industry"
                    />
                  </Field>
                  <Field label="Business Email">
                    <TextInput
                      icon={<Mail className="h-4 w-4" />}
                      value={form.email ?? ""}
                      onChange={() => {}}
                      placeholder="you@business.com"
                      disabled
                    />
                  </Field>
                  <Field label="Phone Number">
                    <TextInput
                      icon={<Phone className="h-4 w-4" />}
                      value={form.phone ?? ""}
                      onChange={(v) => update("phone", v)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Business Website">
                      <TextInput
                        icon={<Globe className="h-4 w-4" />}
                        value={form.website ?? ""}
                        onChange={(v) => update("website", v)}
                        placeholder="www.example.com"
                      />
                    </Field>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!dirty || saving}
                  className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.06)] transition hover:bg-[#eef1f7] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="rounded-full bg-[#feb602] px-6 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        ) : tab === "notifications" ? (
          <NotificationsTab userId={user.id} />
        ) : tab === "integrations" ? (
          <IntegrationsTab userId={user.id} />
        ) : tab === "billing" ? (
          <BillingTab userId={user.id} />
        ) : (
          <SecurityTab email={user.email ?? ""} onDeleted={signOut} />
        )}
      </div>
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <h2 className="mb-4 text-[16px] font-semibold text-[#0a152f]">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label className="text-xs font-medium text-[#737373]">{label}</label> : null}
      {children}
    </div>
  );
}

function TextInput({
  icon,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={
        "flex h-[48px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-3 " +
        (disabled ? "opacity-70" : "")
      }
    >
      <span className="text-[#a3a3a3]">{icon}</span>
      <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-sm text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SelectInput({
  icon,
  value,
  onChange,
  options,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="flex h-[48px] items-center gap-2 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] px-3">
      <span className="text-[#a3a3a3]">{icon}</span>
      <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          "min-w-0 flex-1 appearance-none bg-transparent text-sm focus:outline-none " +
          (value ? "text-[#0a152f]" : "text-[#a3a3a3]")
        }
      >
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

type NotifPrefs = {
  new_customer_joined: boolean;
  reward_earned: boolean;
  reward_redeemed: boolean;
  campaign_created: boolean;
  branch_added: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  new_customer_joined: false,
  reward_earned: true,
  reward_redeemed: true,
  campaign_created: true,
  branch_added: true,
  weekly_summary: false,
  monthly_report: true,
};

function NotificationsTab({ userId }: { userId: string }) {
  const [prefs, setPrefs] = React.useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState<keyof NotifPrefs | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await getAuthSupabase()
        .from("notification_preferences")
        .select(
          "new_customer_joined,reward_earned,reward_redeemed,campaign_created,branch_added,weekly_summary,monthly_report",
        )
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error("Failed to load preferences");
      } else if (data) {
        setPrefs(data as NotifPrefs);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function toggle(key: keyof NotifPrefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setPending(key);
    const { error } = await getAuthSupabase()
      .from("notification_preferences")
      .upsert({ id: userId, ...next }, { onConflict: "id" });
    setPending(null);
    if (error) {
      setPrefs(prefs);
      toast.error("Couldn't save preference");
    } else {
      toast.success("Preferences updated");
    }
  }

  if (loading) {
    return (
      <div className="rounded-[16px] bg-white p-10 text-center text-sm text-[#737373] shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
        Loading preferences…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <NotifCard title="Email Notifications">
        <ToggleRow
          label="New Customer Joined"
          checked={prefs.new_customer_joined}
          busy={pending === "new_customer_joined"}
          onToggle={() => toggle("new_customer_joined")}
        />
        <ToggleRow
          label="Reward Earned"
          checked={prefs.reward_earned}
          busy={pending === "reward_earned"}
          onToggle={() => toggle("reward_earned")}
        />
        <ToggleRow
          label="Reward Redeemed"
          checked={prefs.reward_redeemed}
          busy={pending === "reward_redeemed"}
          onToggle={() => toggle("reward_redeemed")}
        />
        <ToggleRow
          label="Campaign Created"
          checked={prefs.campaign_created}
          busy={pending === "campaign_created"}
          onToggle={() => toggle("campaign_created")}
        />
        <ToggleRow
          label="Branch Added"
          checked={prefs.branch_added}
          busy={pending === "branch_added"}
          onToggle={() => toggle("branch_added")}
        />
      </NotifCard>
      <div className="flex flex-col gap-3">
        <NotifCard title="Weekly Reports">
          <ToggleRow
            label="Send Weekly Summary"
            checked={prefs.weekly_summary}
            busy={pending === "weekly_summary"}
            onToggle={() => toggle("weekly_summary")}
          />
        </NotifCard>
        <NotifCard title="Monthly Reports">
          <ToggleRow
            label="Send Monthly Analytics Report"
            checked={prefs.monthly_report}
            busy={pending === "monthly_report"}
            onToggle={() => toggle("monthly_report")}
          />
        </NotifCard>
      </div>
    </div>
  );
}

function NotifCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 rounded-[12px] border border-[#d7ddea] bg-white p-5">
      <h3 className="text-[16px] font-semibold leading-none text-[#0a152f]">{title}</h3>
      <div className="h-px w-full bg-[#d7ddea]" />
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  busy,
  onToggle,
}: {
  label: string;
  checked: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center">
      <div className="flex-1 text-[16px] text-[#0a152f]">{label}</div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={busy}
        onClick={onToggle}
        className={
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-60 " +
          (checked ? "bg-[#44b678] justify-end" : "bg-[#d4d4d4] justify-start")
        }
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(10,13,18,0.2)]" />
      </button>
    </div>
  );
}

// ============================================================
// Integrations Tab
// ============================================================

type IntegrationProvider =
  | "square"
  | "clover"
  | "toast"
  | "lightspeed"
  | "shopify_pos"
  | "mailchimp"
  | "klaviyo"
  | "twilio"
  | "apple_wallet"
  | "google_wallet";

type IntegrationStatus = "not_configured" | "connected" | "disconnected" | "pending";

type IntegrationRow = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
};

const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  square: "Square",
  clover: "Clover",
  toast: "Toast",
  lightspeed: "Lightspeed",
  shopify_pos: "Shopify POS",
  mailchimp: "Mailchimp",
  klaviyo: "Klaviyo",
  twilio: "Twilio (SMS)",
  apple_wallet: "Apple Wallet",
  google_wallet: "Google Wallet",
};

const INTEGRATION_CATEGORIES: {
  title: string;
  providers: IntegrationProvider[];
  wide?: boolean;
}[] = [
  {
    title: "POS Systems",
    providers: ["square", "clover", "toast", "lightspeed", "shopify_pos"],
    wide: true,
  },
  { title: "Marketing", providers: ["mailchimp", "klaviyo"] },
  { title: "Communication", providers: ["twilio"] },
  { title: "QR & Wallet", providers: ["apple_wallet", "google_wallet"] },
];

function IntegrationsTab({ userId }: { userId: string }) {
  const [rows, setRows] = React.useState<Record<string, IntegrationRow>>({});
  const [loading, setLoading] = React.useState(true);
  const [pendingProvider, setPendingProvider] = React.useState<IntegrationProvider | null>(null);
  const [busy, setBusy] = React.useState<IntegrationProvider | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getAuthSupabase()
        .from("integrations")
        .select("provider,status")
        .eq("owner_id", userId);
      if (cancelled) return;
      const map: Record<string, IntegrationRow> = {};
      (data ?? []).forEach((r: any) => {
        map[r.provider] = { provider: r.provider, status: r.status };
      });
      setRows(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleToggle = async (provider: IntegrationProvider) => {
    setBusy(provider);
    // Record user intent as "pending" — nothing is actually wired to a real
    // provider yet, so we never flip to "connected".
    const nextStatus: IntegrationStatus =
      rows[provider]?.status === "pending" ? "not_configured" : "pending";
    const { error } = await getAuthSupabase()
      .from("integrations")
      .upsert(
        { owner_id: userId, provider, status: nextStatus },
        { onConflict: "owner_id,provider" },
      );
    setBusy(null);
    if (error) {
      toast.error("Could not update integration");
      return;
    }
    setRows((prev) => ({ ...prev, [provider]: { provider, status: nextStatus } }));
    if (nextStatus === "pending") setPendingProvider(provider);
  };

  const renderCard = (title: string, providers: IntegrationProvider[], wide = false) => (
    <section
      key={title}
      className={
        "rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(15,28,61,0.04)] " +
        (wide ? "col-span-full" : "")
      }
    >
      <h2 className="mb-5 text-[18px] font-semibold text-[#0a152f]">{title}</h2>
      <div className="flex flex-col gap-4">
        {providers.map((p) => {
          const on = rows[p]?.status === "pending";
          return (
            <div key={p} className="flex items-center justify-between">
              <span className="text-[14px] text-[#0a152f]">{PROVIDER_LABELS[p]}</span>
              <button
                type="button"
                aria-label={`Toggle ${PROVIDER_LABELS[p]}`}
                disabled={busy === p || loading}
                onClick={() => handleToggle(p)}
                className={
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-60 " +
                  (on ? "bg-[#44b678] justify-end" : "bg-[#d4d4d4] justify-start")
                }
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(10,13,18,0.2)]" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {INTEGRATION_CATEGORIES.map((c) =>
          c.wide ? renderCard(c.title, c.providers, true) : renderCard(c.title, c.providers),
        )}
      </div>

      {pendingProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPendingProvider(null)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-[18px] font-semibold text-[#0a152f]">
              {PROVIDER_LABELS[pendingProvider]} not configured
            </h3>
            <p className="mb-5 text-[14px] leading-relaxed text-[#5a6b8f]">
              This integration requires {PROVIDER_LABELS[pendingProvider]} API credentials to be
              configured before it can connect. Contact support or check back once this is set up.
              We've recorded your interest — you'll be able to finish connecting once credentials
              are in place.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPendingProvider(null)}
                className="rounded-full bg-[#feb602] px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------- Billing Tab --------------------

import {
  type Plan,
  PLAN_LIMITS,
  PLAN_ADMIN_LIMITS,
  PLAN_CONTACT_LIMITS,
  PLAN_PRICES,
  PLAN_LABEL,
  PLAN_ORDER,
} from "@/lib/plans";
import { Check, ChevronDown } from "lucide-react";

type PlanTheme = {
  accent: string; // hex
  priceText: string;
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  ring: string;
  hoverRing: string;
  softBg: string;
};

const PLAN_THEMES: Record<Plan, PlanTheme> = {
  starter: {
    accent: "#feb602",
    priceText: "text-[#feb602]",
    buttonBg: "bg-[#feb602]",
    buttonHover: "hover:bg-[#e29f00]",
    buttonText: "text-white",
    ring: "ring-2 ring-[#feb602]",
    hoverRing: "hover:ring-[#feb602]",
    softBg: "bg-[#fff7e0]",
  },
  growth: {
    accent: "#44b678",
    priceText: "text-[#44b678]",
    buttonBg: "bg-[#44b678]",
    buttonHover: "hover:bg-[#339b63]",
    buttonText: "text-white",
    ring: "ring-2 ring-[#44b678]",
    hoverRing: "hover:ring-[#44b678]",
    softBg: "bg-[#e6f6ee]",
  },
  premium: {
    accent: "#2a3f6e",
    priceText: "text-[#2a3f6e]",
    buttonBg: "bg-[#2a3f6e]",
    buttonHover: "hover:bg-[#1c2c53]",
    buttonText: "text-white",
    ring: "ring-2 ring-[#2a3f6e]",
    hoverRing: "hover:ring-[#2a3f6e]",
    softBg: "bg-[#eaeef7]",
  },
};

const PLAN_TAGLINE: Record<Plan, string> = {
  starter: "Perfect for new businesses",
  growth: "Most popular for growing businesses",
  premium: "For established businesses",
};

const PLAN_EXTRA_FEATURES: Record<Plan, string[]> = {
  starter: [
    "Points, visits & tier programs",
    "Email campaigns",
    "Basic analytics",
    "Email support",
  ],
  growth: [
    "All Starter features",
    "SMS + email campaigns",
    "Advanced analytics & exports",
    "Priority support",
  ],
  premium: [
    "All Growth features",
    "API access",
    "Custom integrations",
    "Dedicated account manager",
  ],
};

function BillingTab({ userId }: { userId: string }) {
  const [plan, setPlan] = React.useState<Plan>("starter");
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState<Plan | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<Plan, boolean>>({
    starter: false,
    growth: false,
    premium: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const p = (data?.plan as Plan | null) ?? "starter";
      setPlan(p === "starter" || p === "growth" || p === "premium" ? p : "starter");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const confirmSwitch = async () => {
    if (!pending) return;
    setSaving(true);
    const { error } = await getAuthSupabase()
      .from("profiles")
      .update({ plan: pending })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not switch plan", { description: error.message });
      return;
    }
    setPlan(pending);
    toast.success(`Switched to ${PLAN_LABEL[pending]} plan`, {
      description: "Placeholder switch — no payment was charged.",
    });
    setPending(null);
  };

  if (loading) {
    return (
      <div className="rounded-[16px] bg-white p-10 text-center text-sm text-[#737373] shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
        Loading billing…
      </div>
    );
  }

  const plans: Plan[] = ["starter", "growth", "premium"];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <PlanCard
            key={p}
            plan={p}
            isCurrent={p === plan}
            currentPlan={plan}
            expanded={expanded[p]}
            onToggleExpand={() => setExpanded((s) => ({ ...s, [p]: !s[p] }))}
            onSelect={() => setPending(p)}
          />
        ))}
      </div>

      {pending ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => (saving ? null : setPending(null))}
        >
          <div
            className="w-full max-w-[440px] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(15,28,61,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-[#0a152f]">
              Switch to {PLAN_LABEL[pending]} plan?
            </h3>
            <p className="mt-2 text-sm text-[#737373]">
              This is a placeholder until real billing is connected — no payment will be charged.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setPending(null)}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0a152f] ring-1 ring-[#e5e7eb] transition hover:bg-[#eef1f7] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={confirmSwitch}
                className="rounded-full bg-[#feb602] px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] transition hover:bg-[#e29f00] disabled:opacity-60"
              >
                {saving ? "Switching…" : "Confirm switch"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlanCard({
  plan,
  isCurrent,
  currentPlan,
  expanded,
  onToggleExpand,
  onSelect,
}: {
  plan: Plan;
  isCurrent: boolean;
  currentPlan: Plan;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  const theme = PLAN_THEMES[plan];
  const isDowngrade = PLAN_ORDER[plan] < PLAN_ORDER[currentPlan];
  const ctaLabel = isCurrent ? "Current Plan" : isDowngrade ? "Downgrade" : "Upgrade Now";

  const baseFeatures = [
    `${(plan === "starter" ? 5_000 : plan === "growth" ? 25_000 : 100_000).toLocaleString()} scans`,
    `${(plan === "starter" ? 1_000 : plan === "growth" ? 10_000 : 50_000).toLocaleString()} customer database`,
    `Up to ${PLAN_LIMITS[plan]} Location${PLAN_LIMITS[plan] === 1 ? "" : "s"}`,
    `Up to ${PLAN_ADMIN_LIMITS[plan]} Admin User${PLAN_ADMIN_LIMITS[plan] === 1 ? "" : "s"}`,
    `Up to ${PLAN_CONTACT_LIMITS[plan].toLocaleString()} Contacts`,
  ];
  const extraFeatures = PLAN_EXTRA_FEATURES[plan];
  const visible = expanded ? [...baseFeatures, ...extraFeatures] : baseFeatures;

  return (
    <section
      className={`flex flex-col gap-6 rounded-[12px] border border-[#d7ddea] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-2 ${theme.hoverRing} ${
        isCurrent ? theme.ring : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-[20px] font-bold leading-[1.2] text-[#0a152f]">{PLAN_LABEL[plan]}</h3>
          <p className="text-sm text-[#737373]">{PLAN_TAGLINE[plan]}</p>
          <p className={`text-[16px] font-semibold ${theme.priceText}`}>
            ${PLAN_PRICES[plan]}/month
          </p>
        </div>
        {isCurrent ? (
          <span
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${theme.softBg}`}
            style={{ color: theme.accent }}
          >
            Current Plan
          </span>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition ${theme.buttonBg} ${theme.buttonHover} ${theme.buttonText}`}
          >
            {ctaLabel}
          </button>
        )}
      </div>

      <div className="h-px w-full bg-[#e5e7eb]" />

      <ul className="flex flex-col gap-4">
        {visible.map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-[15px] text-[#0a152f]">
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: theme.accent }}
            >
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
            {feat}
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-2 text-[15px] font-semibold"
            style={{ color: theme.accent }}
          >
            {expanded ? "Show less" : "Show more"}
            <ChevronDown
              className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </li>
      </ul>
    </section>
  );
}

// =====================================================================
// Security tab
// =====================================================================

function SecurityTab({ email, onDeleted }: { email: string; onDeleted: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChangePasswordCard email={email} />
      <div className="flex flex-col gap-4">
        <TwoFactorCard />
        <DeleteAccountCard onDeleted={onDeleted} />
      </div>
    </div>
  );
}

function ChangePasswordCard({ email }: { email: string }) {
  const sendEmail = sendPasswordChangedEmail;
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCur, setShowCur] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConf, setShowConf] = React.useState(false);
  const [errors, setErrors] = React.useState<{ current?: string; next?: string; confirm?: string }>(
    {},
  );
  const [saving, setSaving] = React.useState(false);

  const nextFeedback = next ? passwordFeedback(next) : null;
  const canSubmit =
    current.length > 0 &&
    next.length > 0 &&
    confirm.length > 0 &&
    !nextFeedback &&
    confirm === next &&
    current !== next;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs: typeof errors = {};
    if (!current) errs.current = "Enter your current password";
    if (!next) errs.next = "Password is required";
    else {
      const f = passwordFeedback(next);
      if (f) errs.next = f;
    }
    if (!confirm) errs.confirm = "Please confirm your new password";
    else if (confirm !== next) errs.confirm = "Passwords do not match";
    if (current && next && current === next) {
      errs.next = "New password must be different from current password";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!email) {
      toast.error("No email on file");
      return;
    }

    setSaving(true);
    const { error: signInErr } = await getAuthSupabase().auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInErr) {
      setSaving(false);
      setErrors({ current: "Current password is incorrect" });
      return;
    }
    const { error: updErr } = await getAuthSupabase().auth.updateUser({ password: next });
    if (updErr) {
      setSaving(false);
      toast.error("Could not update password", { description: updErr.message });
      return;
    }
    try {
      await sendEmail();
    } catch (err) {
      console.error("[password_changed] email notify failed:", err);
    }
    setSaving(false);
    setCurrent("");
    setNext("");
    setConfirm("");
    setErrors({});
    toast.success("Password updated", {
      description: "A confirmation email has been sent.",
    });
  }

  return (
    <section className="rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <h2 className="mb-5 text-[16px] font-semibold text-[#0a152f]">Change Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SecPwField
          placeholder="Current Password"
          value={current}
          onChange={(v) => {
            setCurrent(v);
            if (errors.current) setErrors((e) => ({ ...e, current: undefined }));
          }}
          show={showCur}
          onToggle={() => setShowCur((s) => !s)}
          autoComplete="current-password"
          error={errors.current}
        />
        <SecPwField
          placeholder="New Password"
          value={next}
          onChange={(v) => {
            setNext(v);
            if (errors.next) setErrors((e) => ({ ...e, next: undefined }));
          }}
          show={showNew}
          onToggle={() => setShowNew((s) => !s)}
          autoComplete="new-password"
          error={errors.next}
        />
        <SecPwField
          placeholder="Confirm New Password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          show={showConf}
          onToggle={() => setShowConf((s) => !s)}
          autoComplete="new-password"
          error={errors.confirm}
        />
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#feb602] px-6 py-3 text-xl font-semibold text-[#0A152F] shadow-[0_1px_8px_0_rgba(0,0,0,0.12),0_0_2px_0_rgba(0,0,0,0.1)] transition-transform hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update Password"}
          <ArrowRight className="h-5 w-5 text-[#0A152F]" />
        </button>
      </form>
    </section>
  );
}

function SecPwField({
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex h-[48px] items-center gap-2 rounded-[12px] border bg-[#fafafa] px-3 ${
          error ? "border-red-400" : "border-[#d7ddea]"
        } focus-within:border-[#feb602] focus-within:ring-2 focus-within:ring-[#feb602]/30`}
      >
        <Lock className="h-4 w-4 text-[#a3a3a3]" />
        <span className="h-6 w-px bg-[#e5e5e5]" aria-hidden />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-[#a3a3a3]"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

type MfaFactor = { id: string; status: string; factor_type: string };

function TwoFactorCard() {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [enrolling, setEnrolling] = React.useState(false);
  const [enrollFactorId, setEnrollFactorId] = React.useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = React.useState(false);

  const loadFactors = React.useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await getAuthSupabase().auth.mfa.listFactors();
    if (e) {
      setLoading(false);
      return;
    }
    const totp = (data?.totp ?? []) as MfaFactor[];
    const verified = totp.find((f) => f.status === "verified");
    if (verified) {
      setEnabled(true);
      setFactorId(verified.id);
    } else {
      setEnabled(false);
      setFactorId(null);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  async function startEnroll() {
    setError(null);
    setEnrolling(true);
    // Clean up any lingering unverified factors so enroll doesn't collide.
    const { data: list } = await getAuthSupabase().auth.mfa.listFactors();
    const stale = ((list?.totp ?? []) as MfaFactor[]).filter((f) => f.status !== "verified");
    for (const f of stale) {
      await getAuthSupabase().auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: e } = await getAuthSupabase().auth.mfa.enroll({ factorType: "totp" });
    if (e || !data) {
      setEnrolling(false);
      setError(e?.message ?? "Could not start 2FA enrollment");
      return;
    }
    setEnrollFactorId(data.id);
    setSecret(data.totp.secret);
    try {
      const url = await QRCode.toDataURL(data.totp.uri, { width: 220, margin: 1 });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    }
  }

  async function verifyEnroll() {
    if (!enrollFactorId) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app");
      return;
    }
    setVerifying(true);
    setError(null);
    const { data: challenge, error: cErr } = await getAuthSupabase().auth.mfa.challenge({
      factorId: enrollFactorId,
    });
    if (cErr || !challenge) {
      setVerifying(false);
      setError(cErr?.message ?? "Could not create challenge");
      return;
    }
    const { error: vErr } = await getAuthSupabase().auth.mfa.verify({
      factorId: enrollFactorId,
      challengeId: challenge.id,
      code,
    });
    setVerifying(false);
    if (vErr) {
      setError(vErr.message || "Invalid or expired code. Try again.");
      return;
    }
    toast.success("Two-factor authentication enabled");
    setEnrolling(false);
    setEnrollFactorId(null);
    setSecret(null);
    setQrDataUrl(null);
    setCode("");
    await loadFactors();
  }

  function cancelEnroll() {
    if (enrollFactorId) {
      void getAuthSupabase().auth.mfa.unenroll({ factorId: enrollFactorId });
    }
    setEnrolling(false);
    setEnrollFactorId(null);
    setSecret(null);
    setQrDataUrl(null);
    setCode("");
    setError(null);
  }

  async function disable() {
    if (!factorId) return;
    const { error: e } = await getAuthSupabase().auth.mfa.unenroll({ factorId });
    if (e) {
      toast.error("Could not disable 2FA", { description: e.message });
      return;
    }
    toast.success("Two-factor authentication disabled");
    setConfirmDisable(false);
    await loadFactors();
  }

  return (
    <section className="rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <h2 className="mb-4 text-[16px] font-semibold text-[#0a152f]">Two-Factor Authentication</h2>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#0a152f]">
          <ShieldCheck className="h-4 w-4 text-[#feb602]" />
          Enable 2FA
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={loading || enrolling}
          onClick={() => {
            if (enabled) setConfirmDisable(true);
            else void startEnroll();
          }}
          className={`relative h-7 w-12 rounded-full transition ${
            enabled ? "bg-[#44b678]" : "bg-[#d7ddea]"
          } disabled:opacity-60`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {enrolling && (
        <div className="mt-5 flex flex-col gap-3 rounded-[12px] border border-[#d7ddea] bg-[#fafafa] p-4">
          <p className="text-sm text-[#0a152f]">
            Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy),
            then enter the 6-digit code to confirm.
          </p>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="2FA QR code"
              className="mx-auto h-[200px] w-[200px] rounded-md bg-white p-2 ring-1 ring-[#d7ddea]"
            />
          ) : (
            <p className="text-xs text-[#737373]">Generating QR code…</p>
          )}
          {secret && (
            <div className="text-xs text-[#737373]">
              Can&apos;t scan? Enter this key manually:
              <div className="mt-1 select-all break-all rounded-md bg-white px-2 py-1 font-mono text-[13px] text-[#0a152f] ring-1 ring-[#d7ddea]">
                {secret}
              </div>
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            placeholder="6-digit code"
            className="h-11 rounded-[10px] border border-[#d7ddea] bg-white px-3 text-center text-lg tracking-[0.3em] text-[#0a152f] placeholder:tracking-normal placeholder:text-sm placeholder:text-[#a3a3a3] focus:border-[#feb602] focus:outline-none focus:ring-2 focus:ring-[#feb602]/30"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelEnroll}
              disabled={verifying}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#0a152f] ring-1 ring-[#e5e7eb] hover:bg-[#eef1f7] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyEnroll}
              disabled={verifying}
              className="rounded-full bg-[#feb602] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)] hover:bg-[#e29f00] disabled:opacity-60"
            >
              {verifying ? "Verifying…" : "Verify & Enable"}
            </button>
          </div>
        </div>
      )}

      {confirmDisable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDisable(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(15,28,61,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-[#0a152f]">Disable 2FA?</h3>
            <p className="mt-2 text-sm text-[#737373]">
              Your account will be less secure. You can re-enable it any time.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisable(false)}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0a152f] ring-1 ring-[#e5e7eb] hover:bg-[#eef1f7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={disable}
                className="rounded-full bg-[#b71c1c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#8f1414]"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DeleteAccountCard({ onDeleted }: { onDeleted: () => void }) {
  const runDelete = deleteMyAccount;
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [businessName, setBusinessName] = React.useState<string>("");
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data: userData } = await getAuthSupabase().auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await getAuthSupabase()
        .from("profiles")
        .select("business_name")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      setBusinessName((data?.business_name ?? "").trim());
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const expected = businessName || "DELETE";
  const canConfirm = confirmText.trim() === expected;

  async function handleDelete() {
    setDeleting(true);
    try {
      await runDelete();
      toast.success("Account deleted");
      await getAuthSupabase().auth.signOut();
      onDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete account";
      toast.error("Delete failed", { description: msg });
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-[16px] bg-white p-6 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <h2 className="mb-4 text-[16px] font-semibold text-[#0a152f]">Delete Account</h2>
      <p className="mb-4 text-sm text-[#737373]">
        This permanently deletes your account and all associated business data. This action cannot
        be undone.
      </p>
      <button
        type="button"
        onClick={() => {
          setConfirmText("");
          setOpen(true);
        }}
        className="w-full rounded-[12px] bg-[#b71c1c] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(183,28,28,0.35)] transition hover:bg-[#8f1414]"
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => (deleting ? null : setOpen(false))}
        >
          <div
            className="w-full max-w-[460px] rounded-[16px] bg-white p-6 shadow-[0_20px_50px_rgba(15,28,61,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 text-[#b71c1c]">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[18px] font-semibold">Delete account permanently?</h3>
            </div>
            <p className="text-sm text-[#737373]">
              This will delete your account, business profile, loyalty programs, customers,
              campaigns, branches, rewards, and all related data. There is no undo.
            </p>
            <p className="mt-4 text-sm text-[#0a152f]">
              To confirm, type <span className="font-mono font-semibold">{expected}</span> below:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 h-11 w-full rounded-[10px] border border-[#d7ddea] bg-[#fafafa] px-3 text-sm text-[#0a152f] focus:border-[#b71c1c] focus:outline-none focus:ring-2 focus:ring-[#b71c1c]/20"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0a152f] ring-1 ring-[#e5e7eb] hover:bg-[#eef1f7] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || deleting}
                className="rounded-full bg-[#b71c1c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#8f1414] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SettingsPage;
