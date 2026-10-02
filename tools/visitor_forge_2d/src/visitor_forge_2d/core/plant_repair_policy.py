"""Cross-gate repair policy for A7 Plant Visual Critic V1.

The base critic proposes independent fixes.  This policy resolves conflicts
between them before the shared four-view repair is applied.  In particular, a
fragmented crown near the canvas edge must become denser *inside* its existing
footprint rather than expanding farther out of bounds.
"""
from __future__ import annotations

from .plant_visual_critic import propose_repair as _base_propose_repair


def propose_repair(aggregate: dict) -> dict:
    plan = _base_propose_repair(aggregate)
    clipping = int(aggregate.get("minClippingMarginPx", 99))
    fragmented = (
        float(aggregate.get("meanContinuity", 1.0)) < 0.78
        or float(aggregate.get("meanCrownFill", 0.5)) < 0.32
        or int(aggregate.get("maxIsolatedMasses", 0)) > 4
    )

    if clipping < 4:
        # Never solve clipping by making the authored crown field larger.  Keep
        # the extra count/denser spacing from the fragmentation repair, but pull
        # the silhouette inward and give brush centers a larger safety inset.
        plan["crownRadiusScale"] = min(float(plan.get("crownRadiusScale", 1.0)), 0.96)
        plan["brushScale"] = min(float(plan.get("brushScale", 1.0)), 0.90)
        plan["boundsInsetPx"] = max(int(plan.get("boundsInsetPx", 0)), 8)
        if fragmented:
            plan["minDistanceScale"] = min(float(plan.get("minDistanceScale", 1.0)), 0.88)
            plan["foliageCountScale"] = max(float(plan.get("foliageCountScale", 1.0)), 1.16)
            plan["frontCountScale"] = max(float(plan.get("frontCountScale", 1.0)), 1.20)
        if "resolve_clipping_without_crown_expansion" not in plan["reasons"]:
            plan["reasons"].append("resolve_clipping_without_crown_expansion")
        plan["changed"] = True

    return plan
