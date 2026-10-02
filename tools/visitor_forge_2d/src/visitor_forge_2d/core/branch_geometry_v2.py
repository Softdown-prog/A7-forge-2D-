"""A7 Branch Geometry V2.

Recipe-level refinement for projected plant wood.  It preserves canonical plant
seed/topology and upgrades only the already projected 2D paths: denser organic
centerlines, non-linear taper, branch-base overlap for fused junctions and subtle
path-aligned bark accents.  The output remains ordinary ``tapered_path`` input,
so the generic Geometry Engine stays reusable and the Visual Critic can compare
exactly the same plant identity before/after visual repair.
"""
from __future__ import annotations

import copy
import hashlib
import math
import random
from typing import Sequence

BRANCH_GEOMETRY_CONTRACT = "A7_BRANCH_GEOMETRY_V2"


def _stable_seed(seed: int, branch_id: str, view: str) -> int:
    payload = f"{int(seed)}:{view}:{branch_id}".encode("utf-8")
    return int.from_bytes(hashlib.sha256(payload).digest()[:8], "big")


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, float(value)))


def _sample_polyline(points: Sequence[Sequence[float]], count: int) -> list[list[float]]:
    if len(points) < 2:
        raise ValueError("branch path requires at least two points")
    pts = [(float(p[0]), float(p[1])) for p in points]
    lengths = [0.0]
    for a, b in zip(pts, pts[1:]):
        lengths.append(lengths[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    total = lengths[-1]
    if total <= 1e-8:
        return [[pts[0][0], pts[0][1]] for _ in range(max(2, count))]

    out: list[list[float]] = []
    segment = 0
    for index in range(max(2, count)):
        target = total * (index / max(1, count - 1))
        while segment + 1 < len(lengths) - 1 and lengths[segment + 1] < target:
            segment += 1
        start_d, end_d = lengths[segment], lengths[segment + 1]
        local = 0.0 if end_d <= start_d else (target - start_d) / (end_d - start_d)
        a, b = pts[segment], pts[segment + 1]
        out.append([a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local])
    return out


def _unit(dx: float, dy: float) -> tuple[float, float]:
    length = math.hypot(dx, dy)
    if length <= 1e-8:
        return 0.0, 0.0
    return dx / length, dy / length


def _normal(points: Sequence[Sequence[float]], index: int) -> tuple[float, float]:
    if index <= 0:
        dx = float(points[1][0]) - float(points[0][0])
        dy = float(points[1][1]) - float(points[0][1])
    elif index >= len(points) - 1:
        dx = float(points[-1][0]) - float(points[-2][0])
        dy = float(points[-1][1]) - float(points[-2][1])
    else:
        dx = float(points[index + 1][0]) - float(points[index - 1][0])
        dy = float(points[index + 1][1]) - float(points[index - 1][1])
    ux, uy = _unit(dx, dy)
    return -uy, ux


def _alpha_hex(rgb: str, alpha: float) -> str:
    text = str(rgb).lstrip("#")[:6]
    return f"#{text}{round(_clamp(alpha, 0.0, 1.0) * 255):02X}"


def _organic_path(path: dict, *, order: int, branch_id: str, seed: int, view: str) -> dict:
    out = copy.deepcopy(path)
    raw_points = path.get("points", [])
    start_width = float(path.get("widthStart", path.get("width", 1.0)))
    end_width = float(path.get("widthEnd", start_width))
    samples = {0: 10, 1: 9, 2: 7, 3: 5}.get(int(order), 6)
    rng = random.Random(_stable_seed(seed, branch_id, view))
    points = _sample_polyline(raw_points, samples)

    # Child paths penetrate slightly into the parent.  Rounded caps therefore
    # overlap instead of meeting edge-to-edge, removing the cut/pasted Y-joint.
    if order > 0 and len(points) >= 2:
        ux, uy = _unit(points[1][0] - points[0][0], points[1][1] - points[0][1])
        overlap = _clamp(start_width * (0.28 if order == 1 else 0.22), 0.45, 2.4)
        points[0][0] -= ux * overlap
        points[0][1] -= uy * overlap

    jitter_limit = {0: 0.72, 1: 0.82, 2: 0.52, 3: 0.24}.get(int(order), 0.35)
    jitter_limit = min(jitter_limit, max(0.18, start_width * 0.11))
    phase = rng.uniform(0.0, math.tau)
    previous_noise = 0.0
    for index in range(1, len(points) - 1):
        t = index / (len(points) - 1)
        raw_noise = rng.uniform(-1.0, 1.0)
        noise = previous_noise * 0.42 + raw_noise * 0.58
        previous_noise = noise
        wave = math.sin(math.pi * t) * (0.72 + 0.28 * math.sin(phase + t * math.tau))
        nx, ny = _normal(points, index)
        offset = noise * jitter_limit * wave
        points[index][0] += nx * offset
        points[index][1] += ny * offset

    width_noise_phase = rng.uniform(0.0, math.tau)
    irregularity = {0: 0.055, 1: 0.075, 2: 0.085, 3: 0.06}.get(int(order), 0.06)
    widths: list[float] = []
    for index in range(len(points)):
        t = index / (len(points) - 1)
        # Slightly eased taper looks less like a cone than a linear interpolation.
        eased = t ** 0.82
        width = start_width + (end_width - start_width) * eased
        width *= 1.0 + math.sin(width_noise_phase + t * math.tau * 1.65) * irregularity * math.sin(math.pi * t)
        if order == 0 and t < 0.18:
            width *= 1.0 + 0.10 * (1.0 - t / 0.18)
        elif order > 0 and t < 0.16:
            width *= 1.0 + 0.08 * (1.0 - t / 0.16)
        widths.append(round(max(0.28, width), 4))

    out["points"] = [[round(p[0], 4), round(p[1], 4)] for p in points]
    out["widths"] = widths
    out.pop("widthStart", None)
    out.pop("widthEnd", None)
    out["branchGeometry"] = BRANCH_GEOMETRY_CONTRACT
    return out


def _offset_points(points: Sequence[Sequence[float]], widths: Sequence[float], side: float) -> list[list[float]]:
    out: list[list[float]] = []
    for index, point in enumerate(points):
        nx, ny = _normal(points, index)
        offset = float(widths[index]) * 0.17 * side
        out.append([round(float(point[0]) + nx * offset, 4), round(float(point[1]) + ny * offset, 4)])
    return out


def _bark_accents(path: dict, *, order: int, exposure: float) -> list[dict]:
    if order > 2:
        return []
    points = path.get("points", [])
    widths = path.get("widths", [])
    if len(points) < 5 or len(widths) != len(points) or max(widths, default=0.0) < 1.15:
        return []

    accents: list[dict] = []
    # Keep the accents fragmented; a full center stripe would read as a vector line.
    fragments = [(1, max(3, len(points) // 2 + 1)), (max(2, len(points) // 2), len(points) - 1)]
    colors = (("#3A2418", 0.34, 1.0), ("#B98661", 0.26, -1.0))
    for color, opacity, side in colors:
        shifted = _offset_points(points, widths, side)
        for frag_index, (start, end) in enumerate(fragments):
            frag_points = shifted[start:end]
            frag_widths = widths[start:end]
            if len(frag_points) < 2:
                continue
            line_widths = [round(max(0.24, float(w) * (0.085 if order == 0 else 0.075)), 4) for w in frag_widths]
            accents.append({
                "points": frag_points,
                "widths": line_widths,
                "fill": _alpha_hex(color, opacity * exposure * (0.86 if frag_index else 1.0)),
                "branchGeometryDetail": True,
            })
    return accents


def upgrade_plant_wood_recipe(recipe: dict, structure, *, view: str | None = None) -> dict:
    """Upgrade planner wood nodes while preserving plant identity and graph contract."""
    out = copy.deepcopy(recipe)
    branches = list(structure.branches)
    view_name = str(view or out.get("planner", {}).get("view", "south"))
    seed = int(out.get("graph", {}).get("seed", getattr(structure, "seed", 1)))

    base_paths: list[dict] | None = None
    for node in out.get("graph", {}).get("nodes", []):
        if node.get("id") not in {"wood_structure", "wood_visible"}:
            continue
        raw_paths = node.get("params", {}).get("paths", [])
        if len(raw_paths) != len(branches):
            raise ValueError("branch geometry requires one projected wood path per canonical branch")
        upgraded: list[dict] = []
        for raw, branch in zip(raw_paths, branches):
            upgraded.append(_organic_path(
                raw,
                order=int(branch.order),
                branch_id=str(branch.branch_id),
                seed=seed,
                view=view_name,
            ))
        if node.get("id") == "wood_structure":
            node["params"]["paths"] = upgraded
            base_paths = copy.deepcopy(upgraded)
        else:
            visible = copy.deepcopy(upgraded)
            for path, branch in zip(upgraded, branches):
                visible.extend(_bark_accents(path, order=int(branch.order), exposure=float(branch.exposure)))
            node["params"]["paths"] = visible

    if base_paths is None:
        raise ValueError("branch geometry could not find wood_structure node")

    # The path-aligned accents now provide anisotropy, so the generic material
    # grain can stay subtle instead of forcing a vertical texture onto diagonals.
    for node in out.get("graph", {}).get("nodes", []):
        if node.get("id") == "wood_material":
            params = node.setdefault("params", {})
            params["grainAmount"] = min(float(params.get("grainAmount", 0.15)), 0.085)
            params["coarseAmount"] = max(float(params.get("coarseAmount", 0.15)), 0.13)

    planner = out.setdefault("planner", {})
    planner["branchGeometryContract"] = BRANCH_GEOMETRY_CONTRACT
    planner["branchGeometryV2"] = True
    planner["branchGeometryPathCount"] = len(base_paths)
    return out
