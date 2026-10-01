# A7 Draw Engine V1 — Brush Engine V2 + Node Graph V1

This milestone stops treating each 2D asset as a bespoke Python renderer.

## Contracts

- `A7_BRUSH_ENGINE_V2`: reusable RGBA bitmap brush tips with deterministic stamp, scatter and path strokes.
- `CH_2D_GRAPH_RECIPE_V1`: ordered data graph that composes brushes and image operations.
- Existing procedural renderers remain available and unchanged.

## First node set

- `canvas`: transparent or colored RGBA source.
- `path_brush`: stamps one bitmap tip along authored paths.
- `brush_scatter`: scatters one or more bitmap tips inside weighted ellipse regions.
- `blend`: alpha-composites graph branches.
- `levels`: local contrast/brightness finish while preserving alpha.
- `output`: declares the final graph image.

## Brush library

Brush tips live under `src/visitor_forge_2d/brush_library/`.

They are normal PNG RGBA assets and can be replaced by hand-painted or externally-authored tips without changing renderer code. The initial foliage tips are proof-of-contract assets. The architectural change is that foliage no longer has to be invented from `_irregular_blob()` at render time.

## Pilot

`examples/park_tree_brush_graph_pilot_01.json`

The pilot builds one tree from bitmap bark strokes, three foliage scatter depth passes and a small levels finish. The same engine can later author grass, flowers, rocks, roof tiles, wall wear, decals and other 2D assets.

## Next milestones

1. Brush dynamics: pressure curves, directional scatter, spacing jitter, dual-tip masks and texture maps.
2. More graph nodes: morphology, masks, warp, color ramp, local light/shadow, edge cleanup and palette quantization.
3. Brush-pack metadata and species/style libraries.
4. Art Author graph synthesis from intent.
5. Migrate selected asset families from bespoke renderers to graph recipes only after visual validation.
