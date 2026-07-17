import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Icon } from "./Icon";
import { generateHeatPoints, MAP_CENTER, MAP_ZOOM } from "../data/mock";
import { useTheme } from "../hooks/useTheme";
import "./HotspotMap.css";

/**
 * Case-density heat layer over Bengaluru.
 *
 * Points are currently generated client-side from mock.ts. Once the pipeline
 * lands these come from precomputed hotspot grids (architecture.md §5.3) —
 * real CaseMaster.latitude / .longitude, aggregated server-side. The component
 * boundary is deliberately the same either way: it takes points, it draws them.
 *
 * On the ramp: this uses the conventional green→red heat gradient rather than a
 * single-hue sequential ramp. That's a knowing exception to the sequential rule
 * in design.md §7 — the convention is entrenched for crime density and police
 * users read it natively. It is the ONLY place a multi-hue ramp is allowed.
 */

const TILES = {
  light:
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const HEAT_GRADIENT = {
  0.2: "#5f9d7d",
  0.4: "#b8d14e",
  0.6: "#f2c53d",
  0.8: "#ee8b3a",
  1.0: "#d94436",
};

export function HotspotMap({ height = 380 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  // Create the map once. Theme changes swap the tile layer, not the map.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false, // A demo map that hijacks page scroll is a liability.
    });

    tileRef.current = L.tileLayer(TILES.light, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    L.heatLayer(generateHeatPoints(), {
      radius: 22,
      blur: 26,
      maxZoom: 13,
      minOpacity: 0.32,
      gradient: HEAT_GRADIENT,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tileRef.current) return;
    tileRef.current.setUrl(theme === "dark" ? TILES.dark : TILES.light);
  }, [theme]);

  return (
    <div className="hotspot-map" style={{ height }}>
      <div ref={containerRef} className="hotspot-map__canvas" />

      <div className="hotspot-map__zoom">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => mapRef.current?.zoomIn()}
        >
          <Icon name="plus" size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => mapRef.current?.zoomOut()}
        >
          <Icon name="minus" size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="hotspot-map__layers">
        <button type="button" aria-label="Map layers">
          <Icon name="layers" size={16} />
        </button>
      </div>

      <figure className="hotspot-map__legend">
        <figcaption>Case Density</figcaption>
        <div className="hotspot-map__ramp" role="presentation" />
        <div className="hotspot-map__legend-ends">
          <span>Low</span>
          <span>High</span>
        </div>
      </figure>

      <div className="hotspot-map__filter">
        <button type="button">
          All Crime Heads
          <Icon name="chevron-down" size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
