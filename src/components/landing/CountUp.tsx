import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  target: number;
  duration?: number;
  delay?: number;
  /** Text before the number, e.g. "$" */
  prefix?: string;
  /** Text after the number, e.g. "+", "%", "K+", "M+", "B" */
  suffix?: string;
  /** Number of decimal places to preserve (e.g. 1 for 99.9) */
  decimals?: number;
  /** Start value as a fraction of target (0-1). Defaults to 0.9 (90%). */
  startFraction?: number;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  target,
  duration = 1600,
  delay = 0,
  prefix = "",
  suffix = "+",
  decimals = 0,
  startFraction = 0.9,
}: CountUpProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const startValue = Math.max(0, Math.min(target, target * startFraction));
  const [value, setValue] = useState<number>(prefersReducedMotion ? target : startValue);
  const hasStartedRef = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedRef.current) {
            hasStartedRef.current = true;
            observer.disconnect();

            let rafId = 0;
            let startTime: number | null = null;

            const timeout = window.setTimeout(() => {
              const animate = (timestamp: number) => {
                if (startTime === null) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutQuart(progress);
                const current = startValue + (target - startValue) * eased;
                setValue(progress < 1 ? current : target);
                if (progress < 1) rafId = requestAnimationFrame(animate);
              };
              rafId = requestAnimationFrame(animate);
            }, delay);

            // Cleanup for this branch
            return () => {
              window.clearTimeout(timeout);
              cancelAnimationFrame(rafId);
            };
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, delay, startValue, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {prefix && <span className="text-navy-900">{prefix}</span>}
      <span className="text-navy-900">{formatNumber(value, decimals)}</span>
      {suffix && <span className="text-gold-500">{suffix}</span>}
    </span>
  );
}
