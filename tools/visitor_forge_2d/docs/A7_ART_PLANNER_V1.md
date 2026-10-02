# A7 Art Planner V1

`A7_ART_PLANNER_V1` is the deterministic planning layer between a semantic art request and `CH_2D_GRAPH_RECIPE_V2`.

The current plant pipeline is intentionally split into independent responsibilities:

1. `A7_PLANT_INTENT_V1` describes species, age, crown intent, flowering amount/color, seed and target canvas.
2. `A7_PLANT_STRUCTURE_V2` builds one canonical lightweight 3D plant identity. The same branch IDs/topology are projected into SOUTH, WEST, NORTH and EAST.
3. `A7_ART_PLANNER_V1` compiles each projection into ordinary Draw Engine V2 nodes instead of calling an asset-specific renderer.
4. Fields derive crown density, branch proximity, depth, direction and terminal flowering zones from the projected structure.
5. Foliage uses the field-conditioned cluster/brush engines.
6. Flowering uses `A7_FLOWER_CLUSTER_ENGINE_V1`, which reuses the proven flowering grammar from the approved Ipê Amarelo work: many small rounded blossoms, warm-gold depth, bright lemon highlights, internal occlusion, edge sprays and negative-space windows.
7. Layer/Material/Image Processing nodes finish the asset.

## Four-view identity gate

All four views must preserve the same canonical branch IDs and parent/order topology. A view is a projection of one plant, not an independently generated tree. `plant_planner_worker.py` validates this before publishing review artifacts.

## Structural Plant V2 gate

V2 uses a botanical hierarchy instead of ending the crown on long secondary branches:

- order 0: trunk
- order 1: primary structural branches
- order 2: shorter secondary branches
- order 3: compact terminal twigs

Order-3 twigs are explicitly `flowerBearing=true`. They end inside the crown/flowering zones and become the canonical terminal points used by the Art Planner. The default topology uses two terminal twigs per secondary branch.

`secondaryShortenFactor` keeps secondaries compact. `tertiaryLength`, `tertiaryRise`, `tertiaryFanDeg` and `tertiaryAttach` control terminal ramification without introducing a species-specific renderer.

`visibleWood` is an explicit structural target. Trunk and primary wood remain readable; secondary wood is reduced; flower-bearing twigs receive the lowest exposure. Low-exposure twigs remain present in the alpha/field structure, so foliage and flowers can still follow them even when they are visually hidden by the crown.

For the current default `visibleWood = 0.34`, the intention is readable trunk/forks with terminal ramification mostly absorbed by foliage and blossoms.

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

The planner now proves semantic intent -> canonical botanical structure -> field-aware four-view rendering, with terminal flowering driven by actual flower-bearing twigs. It is still not automatically `artApproved` and is not promoted to runtime by this worker.

The next gate is visual critique/repair: measure exposed-wood ratio, crown continuity, silhouette balance, cluster repetition and four-view identity from the rendered result. Technical graph success alone is not sufficient for production approval.
