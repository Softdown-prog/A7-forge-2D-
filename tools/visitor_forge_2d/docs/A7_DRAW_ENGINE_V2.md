# A7 Draw Engine V2 — architecture direction

This document records the post-pilot redesign of the 2D authoring engine.

## Why the first pilot failed visually

The first `CH_2D_GRAPH_RECIPE_V1` tree proved the graph/worker/provenance contract, but it also exposed two bad drawing primitives:

- woody structure was built by repeatedly stamping a bark bitmap along a path;
- foliage was built from very high counts of independent leaf stamps with no minimum spacing or structural parent.

That combination produces repetition in trunks/branches and noisy moss-like canopies. The problem is architectural, not a seed/color tuning issue.

## New rule

Do not create another asset-specific `*_renderer_vN.py` to solve this class of problem.

The Draw Engine must grow reusable drawing primitives. Asset recipes should compose those primitives.

## Phase 1 — implemented

### `A7_GEOMETRY_ENGINE_V1`

Continuous anti-aliased tapered ribbons/paths.

Node: `tapered_path`

Use it for trunks, branches, stems, roots, cracks, seams, pipes, cables, curbs, rivers and other width-varying paths. Continuous objects must not be faked by repeating bitmap stamps.

### `A7_DISTRIBUTION_ENGINE_V1`

Deterministic minimum-distance placement using a spatial hash.

Node: `spaced_scatter`

Recipes can state that stamp centers must remain at least N authored pixels apart. This prevents uncontrolled pile-up and gives the renderer a usable density ceiling.

## Phase 2 core — implemented

### `A7_BRUSH_ENGINE_V3`

Brush V3 keeps bitmap RGBA tips but adds deterministic art dynamics:

- independent aspect variation while approximately preserving area;
- rotation plus tangent-following rotation for path strokes;
- spacing jitter for path strokes;
- X/Y mirroring;
- tint selection;
- hue jitter;
- saturation/value variation;
- opacity variation.

Nodes:

- `dynamic_scatter`
- `dynamic_path_brush`

V2 stays available for recipe compatibility.

Still planned for later V3 increments: dual-tip masks, texture maps and richer flow/pressure curves.

## Phase 3 foundation — implemented

### `A7_CLUSTER_ENGINE_V1`

Hierarchical compound brushes. A cluster member can be either a bitmap brush or another cluster, with local offset/scale/rotation/mirroring. This makes the following hierarchy possible without an asset-specific renderer:

`leaf -> twig cluster -> branch cluster -> crown mass`

Node: `cluster_scatter`

Cluster centers are distributed with `A7_DISTRIBUTION_ENGINE_V1`, so macro groups keep a minimum center distance while the internal detail remains structurally grouped.

The key production rule is that foliage-scale recipes should distribute tens of meaningful groups, not thousands of independent micro-stamps.

## Existing compatibility nodes

- `canvas`
- `brush_scatter`
- `path_brush`
- `blend`
- `levels`
- `output`

`path_brush` is still useful for genuine repeated motifs, but it must not be the default way to draw a continuous object such as a trunk.

## Next phases

### Phase 4 — fields and masks

Add density maps, avoid masks, direction fields, depth fields and distance fields. Distribution should be conditioned by structure rather than by an ellipse alone.

### Phase 5 — image processing nodes

Add morphology, blur variants, guided smoothing, local contrast, palette operations, alpha cleanup, edge treatment, warp and lighting nodes.

### Phase 6 — brush/material finishing

Finish the Brush V3 backlog: dual-tip masks, texture maps, richer flow curves and brush-pack metadata.

## Production quality gates

A production organic asset should eventually satisfy all of the following:

1. primary structure is continuous geometry or an authored source image;
2. repeated elements have explicit spacing/density control;
3. secondary detail is grouped hierarchically rather than emitted as thousands of independent micro-stamps;
4. depth/light information is explicit in the graph;
5. final alpha and edge cleanup are deterministic;
6. render remains reproducible from recipe + seed + brush pack;
7. runtime promotion remains separate from art generation and requires visual approval.

## Tree validation plan

The old high-count foliage pilot remains only as a compatibility regression artifact and is not an art target.

`draw_engine_cluster_pilot_01.json` is the first architecture pilot using:

`continuous tapered wood -> hierarchical foliage clusters -> levels -> output`

It exists to validate the new primitives, not to declare a final City Horizon tree style.

The next art-quality tree should wait for at least one Phase 4 field primitive so cluster placement can follow structural masks/depth instead of broad ellipse regions alone.
