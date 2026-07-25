import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Icon } from "./Icon";
import { apiGet } from "../api";
import "./HotspotMap.css";

/**
 * Case-density heat layer over Bengaluru.
 *
 * Points come from /api/hotspots — real CaseMaster latitude/longitude with an
 * hour bucket for the time filter, computed by the pipeline. The component takes
 * points and draws them.
 *
 * On the ramp: this uses the conventional green→red heat gradient rather than a
 * single-hue sequential ramp. That's a knowing exception to the sequential rule
 * in design.md §7 — the convention is entrenched for crime density and police
 * users read it natively. It is the ONLY place a multi-hue ramp is allowed.
 */

type HotspotResponse = {
  center: [number, number];
  zoom: number;
  points: [number, number, number, number, number][]; // lat,lng,weight,hour,head
};

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const HEAT_GRADIENT = {
  0.2: "#5f9d7d",
  0.4: "#b8d14e",
  0.6: "#f2c53d",
  0.8: "#ee8b3a",
  1.0: "#d94436",
};

export type MapView = "heat" | "clusters";
export type MapLevel = "zone" | "district";

/**
 * Grid size for cluster aggregation, in degrees.
 *
 * The hotspot points carry coordinates but no administrative unit, so a cluster
 * is a spatial cell rather than a named zone or district. The two sizes are
 * chosen to read at those scales: roughly 2 km for zone, roughly 17 km for
 * district at this latitude.
 */
const CELL_DEG: Record<MapLevel, number> = { zone: 0.02, district: 0.15 };

const RAMP = ["#5f9d7d", "#b8d14e", "#f2c53d", "#ee8b3a", "#d94436"];

export function HotspotMap({
  height = 380,
  showFilterChip = true,
  filterHour = null,
  filterHead = null,
  view = "heat",
  level = "zone",
}: {
  height?: number;
  /** The full Map page moves crime-head filtering into its own top bar, so the
   *  in-map chip is redundant there and gets hidden. */
  showFilterChip?: boolean;
  /** Restrict the heat layer to incidents near this hour (±1h). null = all day. */
  filterHour?: number | null;
  /** Restrict to a crime-head id. null = all heads. */
  filterHead?: number | null;
  /** Continuous heat surface, or discrete counted clusters. */
  view?: MapView;
  /** Cluster granularity — ignored by the heat view. */
  level?: MapLevel;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatRef = useRef<L.HeatLayer | null>(null);
  const clusterRef = useRef<L.LayerGroup | null>(null);
  const [data, setData] = useState<HotspotResponse | null>(null);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [12.955, 77.595],
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false, // A demo map that hijacks page scroll is a liability.
    });
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      heatRef.current = null;
    };
  }, []);

  // Fetch points once.
  useEffect(() => {
    apiGet<HotspotResponse>("/hotspots").then(setData).catch(() => setData(null));
  }, []);

  // Draw / update the heat layer when points arrive or filters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    const hourWindow = (h: number) => {
      if (filterHour == null) return true;
      // circular ±1h window around the selected hour
      const d = Math.min((h - filterHour + 24) % 24, (filterHour - h + 24) % 24);
      return d <= 1;
    };
    const shown = data.points.filter(
      (p) => hourWindow(p[3]) && (filterHead == null || p[4] === filterHead)
    );

    if (view === "heat") {
      // Tear down clusters, draw the heat surface.
      if (clusterRef.current) {
        clusterRef.current.remove();
        clusterRef.current = null;
      }
      const latlngs = shown.map((p) => [p[0], p[1], p[2]] as [number, number, number]);
      if (heatRef.current) {
        heatRef.current.setLatLngs(latlngs);
      } else {
        heatRef.current = L.heatLayer(latlngs, {
          radius: 18,
          blur: 24,
          maxZoom: 13,
          minOpacity: 0.3,
          max: 3,
          gradient: HEAT_GRADIENT,
        }).addTo(map);
      }
      return;
    }

    // --- Cluster view --------------------------------------------------------
    if (heatRef.current) {
      heatRef.current.remove();
      heatRef.current = null;
    }
    if (clusterRef.current) clusterRef.current.remove();

    // Bin points into a fixed grid, then place one marker at each cell's centroid.
    const cell = CELL_DEG[level];
    const bins = new Map<string, { lat: number; lng: number; n: number }>();
    for (const [lat, lng] of shown) {
      const key = `${Math.floor(lat / cell)}:${Math.floor(lng / cell)}`;
      const b = bins.get(key);
      if (b) {
        b.lat += lat;
        b.lng += lng;
        b.n += 1;
      } else {
        bins.set(key, { lat, lng, n: 1 });
      }
    }

    const cells = [...bins.values()];
    const max = cells.reduce((m, c) => Math.max(m, c.n), 1);
    const group = L.layerGroup();

    for (const c of cells) {
      const share = c.n / max;
      const marker = L.circleMarker([c.lat / c.n, c.lng / c.n], {
        radius: 9 + Math.sqrt(share) * 17,
        color: "#ffffff",
        weight: 1.5,
        fillColor: RAMP[Math.min(RAMP.length - 1, Math.floor(share * RAMP.length))],
        fillOpacity: 0.82,
      });
      marker.bindTooltip(
        `<strong>${c.n.toLocaleString("en-IN")}</strong> case${c.n === 1 ? "" : "s"}`,
        { direction: "top", className: "hotspot-map__tip" }
      );
      group.addLayer(marker);
    }

    group.addTo(map);
    clusterRef.current = group;
  }, [data, filterHour, filterHead, view, level]);

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
        <figcaption>
          {view === "heat"
            ? "Case Density"
            : `Cases per ${level === "zone" ? "zone" : "district"} cluster`}
        </figcaption>
        <div className="hotspot-map__ramp" role="presentation" />
        <div className="hotspot-map__legend-ends">
          <span>Low</span>
          <span>High</span>
        </div>
      </figure>

      {showFilterChip && (
        <div className="hotspot-map__filter">
          <button type="button">
            All Crime Heads
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
