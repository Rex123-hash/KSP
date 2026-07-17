/**
 * Adds `L.heatLayer` to leaflet's types.
 *
 * The top-level import is load-bearing: it gives this file module scope, which
 * makes `declare module "leaflet"` an *augmentation* of the real leaflet types.
 * Without it the block would shadow the module entirely and every L.map /
 * L.tileLayer call would fail to resolve.
 */
import "leaflet";

declare module "leaflet" {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: [number, number, number][]): this;
    addLatLng(latlng: [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }

  function heatLayer(
    latlngs: [number, number, number][],
    options?: HeatLayerOptions
  ): HeatLayer;
}
