import { useEffect, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { cn } from "@/lib/utils";

// Single source of truth for support hours.
// day: 0 = Sunday, 1 = Monday, ... 6 = Saturday
// Times are in the visitor's local timezone (24h).
export type HoursRange = { open: string; close: string };
export type DayHours = { day: number; label: string; ranges: HoursRange[] };

export const SUPPORT_HOURS: DayHours[] = [
  { day: 1, label: "Monday", ranges: [{ open: "09:00", close: "18:00" }] },
  { day: 2, label: "Tuesday", ranges: [{ open: "09:00", close: "18:00" }] },
  { day: 3, label: "Wednesday", ranges: [{ open: "09:00", close: "18:00" }] },
  { day: 4, label: "Thursday", ranges: [{ open: "09:00", close: "18:00" }] },
  { day: 5, label: "Friday", ranges: [{ open: "09:00", close: "18:00" }] },
  { day: 6, label: "Saturday", ranges: [{ open: "10:00", close: "14:00" }] },
  { day: 0, label: "Sunday", ranges: [] },
];

// Grouped for display: rows shown in the "Business Hours" card.
export const SUPPORT_HOURS_DISPLAY: { label: string; value: string; closed?: boolean }[] = [
  { label: "Monday – Friday", value: "9:00 AM – 6:00 PM" },
  { label: "Saturday", value: "10:00 AM – 2:00 PM" },
  { label: "Sunday", value: "Closed", closed: true },
];

function parseHM(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

function atTime(date: Date, hm: string) {
  const { h, m } = parseHM(hm);
  return setMilliseconds(setSeconds(setMinutes(setHours(date, h), m), 0), 0);
}

function formatTime(date: Date) {
  return format(date, "h:mm a");
}

type Status = { open: true; closesAt: Date } | { open: false; opensAt: Date };

function computeStatus(now: Date): Status {
  const todayDow = now.getDay();
  const today = SUPPORT_HOURS.find((d) => d.day === todayDow);
  if (today) {
    for (const r of today.ranges) {
      const open = atTime(now, r.open);
      const close = atTime(now, r.close);
      if (now >= open && now < close) {
        return { open: true, closesAt: close };
      }
    }
    // Not currently open — check for a later range today.
    for (const r of today.ranges) {
      const open = atTime(now, r.open);
      if (now < open) return { open: false, opensAt: open };
    }
  }
  // Find next open day within the next 7 days.
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now, i);
    const cfg = SUPPORT_HOURS.find((x) => x.day === d.getDay());
    if (cfg && cfg.ranges.length > 0) {
      return { open: false, opensAt: atTime(d, cfg.ranges[0].open) };
    }
  }
  // Fallback (shouldn't happen if any day is open).
  return { open: false, opensAt: addDays(now, 1) };
}

function humanOpensAt(now: Date, opensAt: Date) {
  const time = formatTime(opensAt);
  if (isSameDay(now, opensAt)) return `Opens today at ${time}`;
  if (isSameDay(addDays(now, 1), opensAt)) return `Opens tomorrow at ${time}`;
  return `Opens ${format(opensAt, "EEEE")} at ${time}`;
}

export function SupportStatus({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Avoid SSR/CSR mismatch: render a neutral placeholder until mounted.
  if (!now) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-navy-900", className)}>
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-navy-200" />
        Checking support status…
      </div>
    );
  }

  const status = computeStatus(now);

  if (status.open) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-navy-900", className)}>
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500/60" />
          <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-success-500" />
        </span>
        <span>
          Support is currently <span className="font-semibold text-success-600">online</span> ·
          Available until {formatTime(status.closesAt)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-navy-900", className)}>
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-navy-300" />
      <span>
        Support is currently <span className="font-semibold text-muted-foreground">offline</span> ·{" "}
        {humanOpensAt(now, status.opensAt)}
      </span>
    </div>
  );
}
