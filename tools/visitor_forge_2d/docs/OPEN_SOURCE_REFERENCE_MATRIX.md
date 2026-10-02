# A7 open-source reference matrix

This file records what the Draw Engine studies, what may be reused directly,
and what is reference-only. The goal is to learn from mature 2D engines without
creating an unauditable license mix.

## Rules

1. Every direct port or copied algorithm must name its upstream project, source
   file, pinned commit and license.
2. Copyleft/GPL code is reference-only unless a separate license audit approves
   that exact file or component.
3. Reimplementing an idea from a reference-only project must be independently
   written in A7 code; do not paste upstream implementation text.
4. Third-party license notices live under `tools/visitor_forge_2d/third_party/`.
5. Provenance is part of the feature contract, not cleanup work for later.

## Current sources

| Project | License posture for A7 | Studied subsystem | A7 status |
| --- | --- | --- | --- |
| mypaint/libmypaint | ISC; direct adaptation allowed with notice | brush inputs, setting mappings, radius/opacity/dab dynamics | `A7_DYNAMICS_MAPPING_V1` adapts the additive piecewise-linear mapping model |
| KDE/krita | GPLv3 repository; reference-only by default | dynamic sensors, brush-engine separation, masked/texture/scatter concepts | architecture reference only; no Krita source copied |
| inkscape/inkscape | copyleft/GPL family; reference-only until file-level audit | paths, vector editing, transforms, geometry workflows | architecture reference only; no Inkscape source copied |
| Skia | permissive/BSD-style project; candidate for later audit | paths, rasterization, masks, shaders, path effects | not integrated |
| G'MIC | mixed/project-specific licensing; audit before reuse | morphology, filtering, local processing, image pipelines | not integrated |

## Pinned references from the first study

### libmypaint

Pinned commit:
`d5a88fbe6649d5ec776bc42ec8c1f4bb29d7fd7f`

Studied files:

- `brushsettings.json`
- `mypaint-mapping.c`
- `mypaint-mapping.h`
- `mypaint-brush.c`
- `COPYING`

The useful architectural lesson is that a setting is not just a random range.
A base value can be driven by named inputs through editable curves. In MyPaint,
examples of inputs include pressure, random, stroke progress, direction, speed,
tilt and custom channels. A7 can use the same *kind* of mapping for deterministic
asset-authoring signals such as stroke progress, radial position, branch depth,
cluster index, direction, density and seeded random values.

### Krita

Studied architecture:

- `plugins/paintops/libpaintop/sensors/KisDynamicSensor.h`
- related dynamic sensor implementations

The useful lesson is the separation of *sensor/input* from *brush option*.
A7 will follow that separation conceptually, but the implementation must remain
independently written while Krita is treated as GPL reference material.

## First imported capability

`A7_DYNAMICS_MAPPING_V1` is the first deliberately upstream-informed subsystem.

It implements:

`output = base + curve(input_1) + curve(input_2) + ...`

with piecewise-linear control points and the interpolation/extrapolation
behavior used by libmypaint's mapping engine.

This is intentionally generic. It will be consumed by Brush Dynamics, Cluster
Engine and later field/mask nodes rather than being tied to trees.
