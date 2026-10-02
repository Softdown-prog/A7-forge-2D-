# A7 Art Planner V1

`A7_ART_PLANNER_V1` is the deterministic planning layer between a semantic art request and `CH_2D_GRAPH_RECIPE_V2`.

The current plant pipeline is intentionally split into independent responsibilities:

1. `A7_PLANT_INTENT_V1` describes species, age, crown intent, flowering amount/color, seed and target canvas.
2. `A7_PLANT_STRUCTURE_V1` builds one canonical lightweight 3D plant identity. The same branch IDs/topology are projected into SOUTH, WEST, NORTH and EAST.
3. `A7_ART_PLANNER_V1` compiles each projection into ordinary Draw Engine V2 nodes instead of calling an asset-specific renderer.
4. Fields derive crown density, branch proximity, depth, direction and terminal flowering zones from the projected structure.
5. Foliage uses the field-conditioned cluster/brush engines.
6. Flowering uses `A7_FLOWER_CLUSTER_ENGINE_V1`, which reuses the proven flowering grammar from the approved Ipê Amarelo work: many small rounded blossoms, warm-gold depth, bright lemon highlights, internal occlusion, edge sprays and negative-space windows.
7. Layer/Material/Image Processing nodes finish the asset.

## Four-view identity gate

All four views must preserve the same canonical branch IDs and parent/order topology. A view is a projection of one plant, not an independently generated tree. `plant_planner_worker.py` validates this before publishing review artifacts.

## Flowering gate

Flowers are not generic foliage tips tinted yellow. `flower_density` is derived from terminal branch positions, and `field_flower_clusters` paints flowering macro-groups inside those terminal zones. The node itself remains species-neutral; the Art Planner chooses palette and density presets.

For the Ipê Amarelo preset, the planner currently carries forward the approved palette grammar:

- back gold: `#D59B08` / `#9A6700`
- mid yellow: `#F2B705` / `#C38300`
- front yellow: `#FFD21A`
- lemon highlight: `#FFE96A`
- warm internal occlusion: `#62431B`

This is a derivation of the existing approved project grammar, not a copy of the production PNG.

## Current visual status

The V1 planner proves semantic intent -> canonical structure -> field-aware four-view rendering. It is **not yet production-art equivalent to the approved Ipê**.

The next structural gate is botanical ramification quality: secondary/terminal twigs must become shorter and denser near crown masses, with flower-bearing terminal twigs ending inside those masses. Long exposed line-like branches are considered a failure even when all technical graph tests pass.

After that gate, the next major layer is a Visual Critic / Repair Loop that measures silhouette balance, exposed-wood ratio, crown continuity, cluster repetition and four-view identity before an asset can be marked `artApproved`.
