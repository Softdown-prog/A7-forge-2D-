"""Cross-gate repair policy for A7 Plant Visual Critic V1.

The base critic proposes independent fixes. This policy resolves conflicts
between them before the shared four-view repair is applied. Structural clipping
is repaired by uniformly scaling the projected graph around the same anchor in
all four views; canonical 3D seed/topology remains untouched.
"""
from __future__ import annotations

from .plant_visual_critic import (
    apply_repair_plan as _base_apply_repair_plan,
    propose_repair as _base_propose_repair,
)


def propose_repair(aggregate: dict) -> dict:
    plan = _base_propose_repair(aggregate)
    clipping = int(aggregate.get("minClippingMarginPx", 99))
    fragmented = (
        float(aggregate.get("meanContinuity", 1.0)) < 0.78
        or float(aggregate.get("meanCrownFill", 0.5)) < 0.32
        or int(aggregate.get("maxIsolatedMasses", 0)) > 4
    )
    plan.setdefault("projectionScale", 1.0)

    if clipping < 4:
        # Clipping can come from projected wood itself, not only brush stamps.
        # Pull the whole projected recipe inward while keeping density high.
        plan["projectionScale"] = 0.95
        plan["crownRadiusScale"] = min(float(plan.get("crownRadiusScale", 1.0)), 1.0)
        plan["brushScale"] = min(float(plan.get("brushScale", 1.0)), 0.96)
        plan["boundsInsetPx"] = max(int(plan.get("boundsInsetPx", 0)), 5)
        if fragmented:
            plan["minDistanceScale"] = min(float(plan.get("minDistanceScale", 1.0)), 0.88)
            plan["foliageCountScale"] = max(float(plan.get("foliageCountScale", 1.0)), 1.16)
            plan["frontCountScale"] = max(float(plan.get("frontCountScale", 1.0)), 1.20)
        if "uniform_projection_fit" not in plan["reasons"]:
            plan["reasons"].append("uniform_projection_fit")
        plan["changed"] = True

    return plan


def _scale_point(point, anchor, factor: float):
    if not isinstance(point, list) or len(point) != 2:
        return point
    ax, ay = float(anchor[0]), float(anchor[1])
    return [
        round(ax + (float(point[0]) - ax) * factor, 4),
        round(ay + (float(point[1]) - ay) * factor, 4),
    ]


def _scale_pair(value, factor: float):
    if not isinstance(value, list) or len(value) != 2:
        return value
    return [round(float(value[0]) * factor, 4), round(float(value[1]) * factor, 4)]


def apply_repair_plan(recipe: dict, plan: dict) -> dict:
    """Apply visual repair plus optional uniform projected fit.

    This transform never changes canonical branch IDs/seed/topology. It only
    changes the 2D projection already compiled into Graph V2.
    """
    out = _base_apply_repair_plan(recipe, plan)
    factor = float(plan.get("projectionScale", 1.0))
    if abs(factor - 1.0) <= 1e-6:
        return out

    anchor = out.get("anchor", [out["canvas"][0] / 2, out["canvas"][1]])
    for node in out.get("graph", {}).get("nodes", []):
        node_id = node.get("id")
        node_type = node.get("type")
        params = node.get("params", {})

        if node_id in {"wood_structure", "wood_visible"}:
            for path in params.get("paths", []):
                path["points"] = [_scale_point(point, anchor, factor) for point in path.get("points", [])]
                if "widthStart" in path:
                    path["widthStart"] = round(float(path["widthStart"]) * factor, 4)
                if "widthEnd" in path:
                    path["widthEnd"] = round(float(path["widthEnd"]) * factor, 4)
                if "widths" in path and isinstance(path["widths"], list):
                    path["widths"] = [round(float(value) * factor, 4) for value in path["widths"]]
                if "outlineWidth" in path:
                    path["outlineWidth"] = round(float(path["outlineWidth"]) * factor, 4)

        if node_id in {"crown_density", "flower_density"}:
            for lobe in params.get("lobes", []):
                lobe["center"] = _scale_point(lobe.get("center"), anchor, factor)
                if "radius" in lobe:
                    lobe["radius"] = _scale_pair(lobe["radius"], factor)

        if node_type == "field_linear_depth":
            if "start" in params:
                params["start"] = _scale_point(params["start"], anchor, factor)
            if "end" in params:
                params["end"] = _scale_point(params["end"], anchor, factor)
        elif node_type == "field_direction_to_point" and "point" in params:
            params["point"] = _scale_point(params["point"], anchor, factor)

        if isinstance(params.get("bounds"), list) and len(params["bounds"]) == 4:
            left, top, right, bottom = params["bounds"]
            p0 = _scale_point([left, top], anchor, factor)
            p1 = _scale_point([right, bottom], anchor, factor)
            params["bounds"] = [
                int(round(min(p0[0], p1[0]))),
                int(round(min(p0[1], p1[1]))),
                int(round(max(p0[0], p1[0]))),
                int(round(max(p0[1], p1[1]))),
            ]

    out.setdefault("planner", {}).setdefault("repair", {})["projectionScale"] = factor
    return out
