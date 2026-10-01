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

Adds continuous anti-aliased tapered ribbons/paths.

Use cases include:

- trunks and branches;
- stems and roots;
- cracks and seams;
- pipes and cables;
- curbs, rivers and other width-varying paths.

Node: `tapered_path`

Important property: a path is continuous geometry, not a chain of overlapping brush stamps.

### `A7_DISTRIBUTION_ENGINE_V1`

Adds deterministic minimum-distance placement using a spatial hash.

Node: `spaced_scatter`

Important property: recipes can state that stamp centers must remain at least N authored pixels apart. This prevents uncontrolled pile-up and gives the renderer a usable density ceiling.

## Existing nodes retained

- `canvas`
- `brush_scatter`
- `path_brush`
- `blend`
- `levels`
- `output`

They remain for compatibility. `path_brush` is still useful for genuine repeated motifs, but it must not be the default way to draw a continuous object such as a trunk.

## Next phases

### Phase 2 — Brush Dynamics

Add spacing jitter, aspect jitter, directional rotation, mirror, color/HSV variation, opacity/flow curves, dual-tip masks and texture maps.

### Phase 3 — Hierarchical clusters

Add reusable compound brushes so an author can build:

`leaf -> twig cluster -> branch cluster -> crown mass`

instead of placing every leaf independently at asset scale.

### Phase 4 — fields and masks

Add density maps, avoid masks, direction fields, depth fields and distance fields. Distribution should be conditioned by structure rather than by an ellipse alone.

### Phase 5 — image processing nodes

Add morphology, blur variants, guided smoothing, local contrast, palette operations, alpha cleanup, edge treatment, warp and lighting nodes.

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

Do not immediately tune another tree with the old recipe.

The next tree validation should happen only after Phase 2 and the first hierarchical cluster primitive exist. At that point the intended structure is:

`branch skeleton -> tapered wood -> twig clusters -> foliage groups -> spaced edge detail -> occlusion/light -> finish -> output`

The old high-count foliage pilot remains only as a compatibility regression artifact and is not an art target.
