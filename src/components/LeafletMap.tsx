import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  lat: number;
  lng: number;
  label: string;
  address: string;
  zoom: number;
}

const brandedIcon = L.divIcon({
  className: "loyaltyloop-marker",
  html: `
    <div style="position:relative;transform:translate(-50%,-100%);">
      <div style="
        width:36px;height:36px;border-radius:9999px;
        background:#FEB602;border:3px solid #ffffff;
        box-shadow:0 6px 16px rgba(15,23,42,0.25);
        display:flex;align-items:center;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B1F3A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div style="
        position:absolute;left:50%;top:34px;transform:translateX(-50%);
        width:0;height:0;border-left:8px solid transparent;
        border-right:8px solid transparent;border-top:12px solid #FEB602;"></div>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [0, 0],
});

function Resize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function LeafletMap({ lat, lng, label, address, zoom }: LeafletMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      keyboard
      className="h-full w-full"
      aria-label={`Interactive map showing ${label}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={brandedIcon}>
        <Popup>
          <div style={{ fontWeight: 600, color: "#0B1F3A" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#556" }}>{address}</div>
        </Popup>
      </Marker>
      <Resize />
    </MapContainer>
  );
}
