import { lazy, Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface InteractiveMapProps {
  lat: number;
  lng: number;
  label: string;
  address: string;
  zoom?: number;
  className?: string;
}

const LeafletMap = lazy(() => import("./LeafletMap"));

function MapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading map"
      className="relative h-[280px] w-full animate-pulse bg-gradient-to-br from-[#EEF2F9] to-[#DDE4F0] sm:h-[420px]"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-gold-500/30 border-t-gold-500 animate-spin" />
      </div>
    </div>
  );
}

export function InteractiveMap({
  lat,
  lng,
  label,
  address,
  zoom = 15,
  className,
}: InteractiveMapProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const el = document.getElementById("interactive-map-root");
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${label}, ${address}`,
  )}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div
      id="interactive-map-root"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#D7DDEA] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <div className="h-[280px] w-full sm:h-[420px]">
        {visible && mounted ? (
          <Suspense fallback={<MapSkeleton />}>
            <LeafletMap lat={lat} lng={lng} label={label} address={address} zoom={zoom} />
          </Suspense>
        ) : (
          <MapSkeleton />
        )}
      </div>

      <div className="pointer-events-none absolute left-4 top-4 z-[400] flex flex-col gap-1 rounded-xl bg-white/95 px-4 py-3 shadow-md backdrop-blur">
        <span className="text-sm font-semibold text-navy-900">{label}</span>
        <span className="text-xs text-muted-foreground">{address}</span>
      </div>

      <div className="absolute bottom-4 right-4 z-[400] flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get directions in Google Maps"
          className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-md transition hover:bg-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          Directions
        </a>
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open location in Google Maps"
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-md ring-1 ring-[#D7DDEA] transition hover:bg-[#F5F7FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          Open in Maps
        </a>
      </div>
    </div>
  );
}

export default InteractiveMap;
