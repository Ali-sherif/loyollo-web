import * as React from "react";
import {
  Cake,
  ShoppingCart,
  Star,
  CalendarClock,
  Gift,
  Tag,
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthSupabase } from "@/integrations/supabase/auth-client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type AutomationType =
  | "birthday_rewards"
  | "welcome_new_customers"
  | "vip_tier_upgrade"
  | "re_engagement"
  | "points_expiry"
  | "promotional_offer"
  | "feedback_request";

export type Automation = {
  id: string;
  owner_id: string;
  type: AutomationType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const TYPE_META: Record<
  AutomationType,
  { label: string; defaultName: string; icon: LucideIcon; color: string; bg: string }
> = {
  birthday_rewards: {
    label: "Birthday Rewards",
    defaultName: "Birthday Rewards",
    icon: Cake,
    color: "#e26aa5",
    bg: "#fdeaf3",
  },
  welcome_new_customers: {
    label: "Welcome New Customers",
    defaultName: "Welcome New Customers",
    icon: ShoppingCart,
    color: "#344f89",
    bg: "#e8f0ff",
  },
  vip_tier_upgrade: {
    label: "VIP Tier Upgrade",
    defaultName: "VIP Tier Upgrade",
    icon: Star,
    color: "#feb602",
    bg: "#fff5d6",
  },
  re_engagement: {
    label: "Re-engagement",
    defaultName: "Re-engagement",
    icon: CalendarClock,
    color: "#7c5ce5",
    bg: "#efeafd",
  },
  points_expiry: {
    label: "Points Expiry",
    defaultName: "Points Expiry Reminder",
    icon: Gift,
    color: "#44b678",
    bg: "#effaf4",
  },
  promotional_offer: {
    label: "Promotional Offer",
    defaultName: "Promotional Offer",
    icon: Tag,
    color: "#e07a1f",
    bg: "#fdf1e5",
  },
  feedback_request: {
    label: "Feedback Request",
    defaultName: "Feedback Request",
    icon: FileText,
    color: "#525252",
    bg: "#f4f4f5",
  },
};

const ALL_TYPES = Object.keys(TYPE_META) as AutomationType[];

export function AutomationsSection({ ownerId }: { ownerId: string }) {
  const [rows, setRows] = React.useState<Automation[]>([]);
  const [ready, setReady] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Automation | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { data, error } = await getAuthSupabase()
        .from("campaign_automations")
        .select("id, owner_id, type, name, enabled, config, created_at, updated_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error(error.message);
      } else {
        setRows((data as Automation[] | null) ?? []);
      }
      setReady(true);
    })();
  }, [ownerId]);

  const usedTypes = new Set(rows.map((r) => r.type));
  const availableTypes = ALL_TYPES.filter((t) => !usedTypes.has(t));

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || TYPE_META[r.type].label.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const handleToggle = async (row: Automation, next: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, enabled: next } : r)));
    const { error } = await getAuthSupabase()
      .from("campaign_automations")
      .update({ enabled: next })
      .eq("id", row.id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, enabled: !next } : r)));
      toast.error(error.message);
      return;
    }
    toast.success(next ? "Automation enabled" : "Automation paused");
  };

  const handleCreate = async (type: AutomationType, name: string) => {
    const { data, error } = await getAuthSupabase()
      .from("campaign_automations")
      .insert({ owner_id: ownerId, type, name: name.trim(), enabled: true })
      .select("id, owner_id, type, name, enabled, config, created_at, updated_at")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => [...prev, data as Automation]);
    setCreateOpen(false);
    toast.success("Automation created");
  };

  const handleEdit = async (name: string) => {
    if (!editTarget) return;
    const { data, error } = await getAuthSupabase()
      .from("campaign_automations")
      .update({ name: name.trim() })
      .eq("id", editTarget.id)
      .select("id, owner_id, type, name, enabled, config, created_at, updated_at")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === editTarget.id ? (data as Automation) : r)));
    setEditTarget(null);
    toast.success("Automation updated");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await getAuthSupabase()
      .from("campaign_automations")
      .delete()
      .eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Automation deleted");
  };

  return (
    <section className="rounded-[16px] bg-white p-5 shadow-[0_1px_2px_rgba(15,28,61,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[#0a152f]">Scheduled automations</h2>
          <p className="mt-1 text-[13px] text-[#737373]">
            Trigger-based campaigns that run automatically for your customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={availableTypes.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#feb602] px-4 py-2.5 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] disabled:opacity-50"
        >
          <Plus className="h-4 w-4 text-[#0a152f]" aria-hidden />
          New automation
        </button>
      </div>

      <div className="mt-4 flex h-11 max-w-[372px] items-center rounded-full bg-[#fafafa] px-4 ring-1 ring-[#eef1f7] focus-within:ring-2 focus-within:ring-[#feb602]">
        <Search className="h-4 w-4 text-[#8698bb]" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search automations"
          className="ml-3 w-full bg-transparent text-[14px] text-[#0a152f] placeholder:text-[#a3a3a3] focus:outline-none"
        />
      </div>

      <div className="mt-4">
        {!ready ? (
          <div className="py-10 text-center text-[13px] text-[#737373]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="max-w-[520px] space-y-2 px-4">
              <h3 className="text-[16px] font-bold text-[#0a152f]">
                {rows.length === 0 ? "No automations yet" : "No matching automations"}
              </h3>
              <p className="text-[14px] text-[#737373]">
                {rows.length === 0
                  ? "Set up automated campaigns to engage customers at key moments — birthdays, first visits, and more."
                  : "Try a different search."}
              </p>
            </div>
            {rows.length === 0 && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                New automation
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#eef1f7]">
            {filtered.map((row) => {
              const meta = TYPE_META[row.type];
              const Icon = meta.icon;
              return (
                <li key={row.id} className="flex items-center gap-4 py-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <Icon className="h-5 w-5" color={meta.color} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#0a152f]">{row.name}</p>
                    <p className="mt-0.5 text-[12px] text-[#737373]">{meta.label}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        row.enabled ? "bg-[#2f9d5b]" : "bg-[#a3a3a3]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[13px] font-medium",
                        row.enabled ? "text-[#2f9d5b]" : "text-[#737373]",
                      )}
                    >
                      {row.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <Switch
                    checked={row.enabled}
                    onCheckedChange={(v) => void handleToggle(row, v)}
                    aria-label={row.enabled ? "Pause automation" : "Enable automation"}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Automation actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8698bb] transition hover:bg-[#eef1f7] hover:text-[#0a152f]"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => setEditTarget(row)}>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setDeleteTarget(row)}
                        className="text-red-600 focus:text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AutomationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        availableTypes={availableTypes}
        onSubmit={(type, name) => handleCreate(type, name)}
      />
      <AutomationDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        mode="edit"
        availableTypes={editTarget ? [editTarget.type] : []}
        initial={editTarget}
        onSubmit={(_type, name) => handleEdit(name)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this automation?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. This can't be undone.
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
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function AutomationDialog({
  open,
  onOpenChange,
  mode,
  availableTypes,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  availableTypes: AutomationType[];
  initial?: Automation | null;
  onSubmit: (type: AutomationType, name: string) => Promise<void>;
}) {
  const [type, setType] = React.useState<AutomationType | null>(null);
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setType(initial.type);
      setName(initial.name);
    } else {
      setType(availableTypes[0] ?? null);
      setName(availableTypes[0] ? TYPE_META[availableTypes[0]].defaultName : "");
    }
  }, [open, mode, initial, availableTypes]);

  const isEdit = mode === "edit";
  const canSubmit = !!type && name.trim().length > 0;

  const handle = async () => {
    if (!type || !canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(type, name);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit automation" : "New automation"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Rename this automation." : "Pick an automation type and give it a name."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Type</Label>
              {availableTypes.length === 0 ? (
                <p className="text-[13px] text-[#737373]">
                  You've already added every automation type.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {availableTypes.map((t) => {
                    const meta = TYPE_META[t];
                    const Icon = meta.icon;
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setName(meta.defaultName);
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-[10px] border p-3 text-left transition",
                          active
                            ? "border-[#feb602] bg-[#fff9e5]"
                            : "border-[#eef1f7] bg-white hover:bg-[#fafafa]",
                        )}
                      >
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <Icon className="h-4 w-4" color={meta.color} aria-hidden />
                        </span>
                        <span className="text-[13px] font-semibold text-[#0a152f]">
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auto-name">Name</Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Automation name"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => void handle()}
            disabled={!canSubmit || submitting}
            className="rounded-full bg-[#feb602] px-4 py-2 text-sm font-semibold text-[#0a152f] shadow-[0_1px_8px_rgba(0,0,0,0.12)] transition hover:bg-[#e29f00] disabled:opacity-50"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create automation"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
