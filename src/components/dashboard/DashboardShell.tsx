import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  Bell,
  User,
  LayoutGrid,
  Users,
  Gift,
  GitBranch,
  Megaphone,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";



import loyolloLogoWhite from "@/assets/loyollo-logo-white-sidebar.svg";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
};

const MAIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, to: "/dashboard" },
  { id: "customers", label: "Customers", icon: Users, to: "/customers" },
  { id: "loyalty", label: "Loyalty Program", icon: Gift, to: "/loyalty-program" },
  { id: "branches", label: "Branches", icon: GitBranch, to: "/branches" },
];
const GROWTH_NAV: NavItem[] = [
  { id: "campaigns", label: "Campaigns", icon: Megaphone, to: "/campaigns" },
  { id: "analytics", label: "Analytics", icon: BarChart3, to: "/analytics" },
];

export function DashboardShell({
  firstName,
  onSignOut,
  children,
}: {
  firstName: string;
  onSignOut: () => Promise<{ error: unknown } | void> | void;
  children: React.ReactNode;
}) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (mounted) setAvatarUrl((data?.avatar_url as string | null) ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const closeMobileNav = React.useCallback(() => setMobileNavOpen(false), []);

  // Close drawer on route change
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#0f1c3d]">
      <div className="flex min-h-screen">
        <DashboardSidebar onSignOut={onSignOut} />
        <div className="min-w-0 flex-1 bg-[#eef1f7]">
          <DashboardHeader
            firstName={firstName}
            avatarUrl={avatarUrl}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="px-4 pb-10 pt-2 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={closeMobileNav}
        onSignOut={onSignOut}
      />
    </div>
  );
}

function DashboardSidebar({
  onSignOut,
}: {
  onSignOut: () => Promise<{ error: unknown } | void> | void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (item: NavItem) =>
    !!item.to && (pathname === item.to || pathname.startsWith(item.to + "/"));

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-[#0f1c3d] px-4 py-6 text-[#b0bcd4] md:flex">
      <div className="mb-8 flex justify-center">
        <img
          src={loyolloLogoWhite}
          alt="Loyollo"
          className="h-8 w-auto"
        />
      </div>
      <NavSection label="Main" items={MAIN_NAV} isActive={isActive} />
      <div className="mt-6" />
      <NavSection label="Growth" items={GROWTH_NAV} isActive={isActive} />
      <div className="mt-auto flex flex-col gap-1 pt-6">
        <SidebarItem
          icon={SettingsIcon}
          label="Settings"
          active={pathname === "/settings" || pathname.startsWith("/settings/")}
          to="/settings"
        />
        <SidebarItem
          icon={LogOut}
          label="Logout"
          active={false}
          onClick={() => onSignOut()}
        />
      </div>
    </aside>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  onSignOut: () => Promise<{ error: unknown } | void> | void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (item: NavItem) =>
    !!item.to && (pathname === item.to || pathname.startsWith(item.to + "/"));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute inset-y-0 left-0 flex w-[260px] max-w-[80vw] flex-col bg-[#0f1c3d] px-4 py-6 text-[#b0bcd4] shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <img src={loyolloLogoWhite} alt="Loyollo" className="h-8 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavSection label="Main" items={MAIN_NAV} isActive={isActive} />
        <div className="mt-6" />
        <NavSection label="Growth" items={GROWTH_NAV} isActive={isActive} />
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <SidebarItem
            icon={SettingsIcon}
            label="Settings"
            active={pathname === "/settings" || pathname.startsWith("/settings/")}
            to="/settings"
          />
          <SidebarItem
            icon={LogOut}
            label="Logout"
            active={false}
            onClick={() => onSignOut()}
          />
        </div>
      </aside>
    </div>
  );
}


function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (item: NavItem) => boolean;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[11px] uppercase tracking-wide text-[#b0bcd4]/70">
        {label}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((it) => (
          <li key={it.id}>
            <SidebarItem icon={it.icon} label={it.label} active={isActive(it)} to={it.to} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  to,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const className = `flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 ${
    active
      ? "bg-[#feb602] text-white shadow-[0_4px_14px_rgba(254,182,2,0.35)]"
      : "text-[#b0bcd4] hover:bg-white/5 hover:text-white"
  }`;

  if (to) {
    return (
      <Link to={to} className={className} aria-current={active ? "page" : undefined}>
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function DashboardHeader({
  firstName,
  avatarUrl,
  onOpenMobileNav,
}: {
  firstName: string;
  avatarUrl: string | null;
  onOpenMobileNav: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-2 px-3 py-4 sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,28,61,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60 md:hidden"
      >
        <Menu className="h-5 w-5 text-[#0a152f]" />
      </button>
      <div className="relative min-w-0 flex-1 sm:max-w-[420px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3a3a3]"
          aria-hidden
        />
        <label className="sr-only" htmlFor="dashboard-search">
          Search
        </label>
        <input
          id="dashboard-search"
          type="search"
          placeholder="Search"
          className="h-10 w-full rounded-full border-0 bg-white pl-9 pr-4 text-sm text-[#0a152f] placeholder:text-[#a3a3a3] shadow-[0_1px_2px_rgba(15,28,61,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsBell />


        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center gap-2 rounded-full bg-white pl-1 pr-3 py-1 text-sm text-[#0a152f] shadow-[0_1px_2px_rgba(15,28,61,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
          aria-label={`Account menu for ${firstName || "user"}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1f7] overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-[#344f89]" />
            )}
          </span>
        </button>
      </div>
    </header>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,28,61,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
    >
      {children}
    </button>
  );
}

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

function NotificationsBell() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setItems([]);
        return;
      }
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, message, link, read, created_at")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setItems((data as NotificationRow[] | null) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  };

  const handleClick = async (n: NotificationRow) => {
    setOpen(false);
    if (!n.read) await markRead(n.id);
    if (n.link) navigate({ to: n.link });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,28,61,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#feb602]/60"
        >
          <Bell className="h-4 w-4 text-[#0a152f]" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e5484d] px-1 text-[10px] font-semibold text-white ring-2 ring-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-[#eef1f7] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#0a152f]">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-[#344f89] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#8698bb]">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#8698bb]">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-[#eef1f7]">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f6f8fc] focus:bg-[#f6f8fc] focus:outline-none"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.read ? "bg-transparent" : "bg-[#3b6cff]"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#0a152f]">{n.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#5b6b8c]">
                        {n.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#8698bb]">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

