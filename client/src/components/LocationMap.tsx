import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationMap.css";

/**
 * Single-point location map for a case's place of occurrence. Real lat/long
 * comes from CaseMaster; the marker is a plain CSS pin (no external image
 * assets, no CDN request). Interaction is disabled — it's a locator, not a tool.
 */

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const PIN = L.divIcon({
  className: "location-pin",
  html: '<span class="location-pin__dot"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 24],
});

type Props = {
  lat: number;
  lng: number;
  height?: number;
};

export function LocationMap({ lat, lng, height = 320 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
    });
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    L.marker([lat, lng], { icon: PIN }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div className="location-map" style={{ height }}>
      <div ref={ref} className="location-map__canvas" />
    </div>
  );
}
