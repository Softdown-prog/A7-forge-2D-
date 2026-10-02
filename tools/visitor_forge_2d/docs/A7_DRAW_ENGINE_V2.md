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

A7 may study mature open-source art engines, but reuse must be license-aware and auditable. Direct adaptations record upstream project, source file, pinned commit and license. GPL/copy-left implementations are reference-only unless separately approved. See `OPEN_SOURCE_REFERENCE_MATRIX.md`.

## Phase 1 — implemented

### `A7_GEOMETRY_ENGINE_V1`

Continuous anti-aliased tapered ribbons/paths.

Node: `tapered_path`

Use it for trunks, branches, stems, roots, cracks, seams, pipes, cables, curbs, rivers and other width-varying paths. Continuous objects must not be faked by repeating bitmap stamps.

### `A7_VECTOR_PATH_V1`

General vector paths inspired by the path/contour organization used in mature engines such as Skia, implemented independently for A7.

Node: `vector_path`

Current commands:

- `move`
- `line`
- `quad`
- `cubic`
- `close`

Current capabilities:

- multiple contours;
- adaptive Bézier flattening;
- authored scale/rotation/translation around an origin;
- fill and stroke;
- round/butt caps;
- supersampled antialiasing.

Use `vector_path` for general shape/path geometry and `tapered_path` when width must vary continuously along the authored path.

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

### `A7_DYNAMICS_MAPPING_V1`

The first deliberately upstream-informed subsystem. It adapts the permissively licensed libmypaint mapping model: each output has a base value plus piecewise-linear curves driven by named inputs.

### `A7_SENSOR_CONTEXT_V1`

Generic deterministic sensor/input contract. It is an independent A7 implementation after studying Krita's GPL sensor/option separation.

Current common signals include:

- `stroke`, `index`, `random`;
- `direction`, `direction_01`;
- `radial`;
- `x`, `y`, `x_norm`, `y_norm`;
- `distance`, `distance_norm`;
- `region`;
- `pressure`, `speed`;
- `depth`, `density`.

The contract is intentionally not brush-specific. Cluster, field, mask, lighting and processing nodes should be able to consume the same signals later.

### `A7_BRUSH_OPTION_BINDINGS_V1`

Separates semantic brush options from sensor production. Sensor values pass through `A7_DYNAMICS_MAPPING_V1` curves and produce options such as scale, aspect, rotation, opacity, hue/value/saturation and offsets.

### `A7_MAPPED_BRUSH_ENGINE_V1`

Connects Brush V3 to the generic sensor context and option-binding system.

Node: `mapped_dynamic_scatter`

### `A7_DAB_DENSITY_V1`

Adapts libmypaint's radius-aware spatial dab-density decomposition. Dynamic path brushes may use `dabsPerActualRadius` and `dabsPerBasicRadius` instead of a fixed pixel spacing. Larger brush tips naturally move farther between dabs while smaller tips become proportionally denser.

The old `spacing` parameter remains as the compatibility fallback when both density values are zero.

Still planned for later Brush V3 increments: dual-tip masks, texture maps and richer flow/pressure behavior.

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

## Open-source engineering direction

### libmypaint

ISC-licensed and suitable for selective direct adaptation with retained notice. Current A7 adaptations are mapping curves and radius-aware dab density. MyPaint remains a study target for stroke state, opacity/flow behavior and brush input semantics.

### Krita

GPL reference by default. Its sensor/brush-option separation, multiple paint engines, masked brushes, texture/scatter systems and preset architecture are design references. No Krita implementation code is copied into A7.

### Inkscape

Reference target for vector/path authoring, transforms and geometry workflow. Treat implementation as copy-left reference unless a specific file/component is audited otherwise.

### Skia

BSD-style permissive reference. A7 currently studies its path/contour organization and independently implements the useful subset in `A7_VECTOR_PATH_V1`. Skia is not currently a runtime dependency.

### Image-processing projects

G'MIC and similar engines are the next reference targets for morphology, filtering, local processing and image pipelines. Each integration gets a separate provenance/license audit.

## Next phases

### Phase 4 — fields and masks

Add density maps, avoid masks, direction fields, depth fields and distance fields. Distribution should be conditioned by structure rather than by an ellipse alone. These field values should also become inputs to `A7_SENSOR_CONTEXT_V1`/`A7_DYNAMICS_MAPPING_V1`, allowing one curve system to drive brushes and structured asset generation.

### Phase 5 — image processing nodes

Add morphology, blur variants, guided smoothing, local contrast, palette operations, alpha cleanup, edge treatment, warp and lighting nodes.

### Phase 6 — brush/material finishing

Finish the Brush V3 backlog: dual-tip masks, texture maps, richer flow curves and brush-pack metadata.

## Production quality gates

A production organic asset should eventually satisfy all of the following:

1. primary structure is continuous geometry, vector geometry or an authored source image;
2. repeated elements have explicit spacing/density control;
3. secondary detail is grouped hierarchically rather than emitted as thousands of independent micro-stamps;
4. depth/light information is explicit in the graph;
5. final alpha and edge cleanup are deterministic;
6. render remains reproducible from recipe + seed + brush pack;
7. runtime promotion remains separate from art generation and requires visual approval;
8. upstream-informed code has explicit provenance and license records.

## Tree validation plan

The old high-count foliage pilot remains only as a compatibility regression artifact and is not an art target.

`draw_engine_cluster_pilot_01.json` is the first architecture pilot using:

`continuous tapered wood -> hierarchical foliage clusters -> levels -> output`

It exists to validate the new primitives, not to declare a final City Horizon tree style.

The next art-quality tree should wait for at least one Phase 4 field primitive so cluster placement can follow structural masks/depth instead of broad ellipse regions alone.
