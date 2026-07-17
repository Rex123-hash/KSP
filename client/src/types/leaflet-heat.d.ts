/**
 * Ambient declaration for the untyped `leaflet.heat` plugin.
 *
 * This file must NOT contain a top-level import/export — that would turn it
 * into a module, and `declare module "leaflet.heat"` would then be read as an
 * augmentation of an existing module rather than a declaration of a new one.
 *
 * The companion augmentation of `leaflet` itself lives in `leaflet-augment.d.ts`,
 * which does need module scope. The two cannot share a file.
 */
declare module "leaflet.heat";
