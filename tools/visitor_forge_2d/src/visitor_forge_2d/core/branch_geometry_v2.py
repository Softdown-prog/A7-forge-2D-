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
    samples = {0: 11, 1: 10, 2: 8, 3: 6}.get(int(order), 7)
    rng = random.Random(_stable_seed(seed, branch_id, view))
    points = _sample_polyline(raw_points, samples)

    # Child paths penetrate into their parent and receive a short base flare.
    # This turns a hard Y-junction into a fused shoulder without adding a blob.
    if order > 0 and len(points) >= 2:
        ux, uy = _unit(points[1][0] - points[0][0], points[1][1] - points[0][1])
        overlap_factor = 0.38 if order == 1 else (0.30 if order == 2 else 0.24)
        overlap = _clamp(start_width * overlap_factor, 0.55, 3.0)
        points[0][0] -= ux * overlap
        points[0][1] -= uy * overlap

    # Low-frequency screen-space drift breaks the spline/ruler look while
    # remaining small enough to preserve the canonical branch direction.
    jitter_cap = {0: 1.00, 1: 1.15, 2: 0.72, 3: 0.34}.get(int(order), 0.45)
    jitter_limit = min(jitter_cap, max(0.28, start_width * 0.20))
    phase = rng.uniform(0.0, math.tau)
    previous_noise = 0.0
    for index in range(1, len(points) - 1):
        t = index / (len(points) - 1)
        raw_noise = rng.uniform(-1.0, 1.0)
        noise = previous_noise * 0.58 + raw_noise * 0.42
        previous_noise = noise
        broad_wave = math.sin(math.pi * t)
        modulation = 0.78 + 0.22 * math.sin(phase + t * math.tau * 0.82)
        nx, ny = _normal(points, index)
        offset = noise * jitter_limit * broad_wave * modulation
        points[index][0] += nx * offset
        points[index][1] += ny * offset

    width_noise_phase = rng.uniform(0.0, math.tau)
    irregularity = {0: 0.050, 1: 0.080, 2: 0.090, 3: 0.060}.get(int(order), 0.06)
    widths: list[float] = []
    for index in range(len(points)):
        t = index / (len(points) - 1)
        eased = t ** 0.82
        width = start_width + (end_width - start_width) * eased
        width *= 1.0 + math.sin(width_noise_phase + t * math.tau * 1.45) * irregularity * math.sin(math.pi * t)
        if order == 0 and t < 0.16:
            width *= 1.0 + 0.08 * (1.0 - t / 0.16)
        elif order == 1 and t < 0.22:
            width *= 1.0 + 0.17 * (1.0 - t / 0.22)
        elif order == 2 and t < 0.19:
            width *= 1.0 + 0.12 * (1.0 - t / 0.19)
        elif order >= 3 and t < 0.15:
            width *= 1.0 + 0.07 * (1.0 - t / 0.15)
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
        offset = float(widths[index]) * 0.15 * side
        out.append([round(float(point[0]) + nx * offset, 4), round(float(point[1]) + ny * offset, 4)])
    return out


def _fragment(points: Sequence[Sequence[float]], widths: Sequence[float], start_t: float, end_t: float) -> tuple[list, list]:
    last = len(points) - 1
    start = max(0, min(last - 1, round(last * start_t)))
    end = max(start + 2, min(len(points), round(last * end_t) + 1))
    return list(points[start:end]), list(widths[start:end])


def _bark_accents(path: dict, *, order: int, exposure: float) -> list[dict]:
    if order > 2:
        return []
    points = path.get("points", [])
    widths = path.get("widths", [])
    if len(points) < 5 or len(widths) != len(points) or max(widths, default=0.0) < 1.15:
        return []

    # Short broken marks follow the branch tangent.  They suggest bark without
    # creating the long parallel racing stripes seen in the first V2 pilot.
    if order == 0:
        specs = [
            (0.12, 0.25, "#3A2418", 0.22, 1.0),
            (0.36, 0.49, "#B98661", 0.16, -1.0),
            (0.60, 0.72, "#3A2418", 0.18, 1.0),
            (0.78, 0.88, "#B98661", 0.13, -1.0),
        ]
    elif order == 1:
        specs = [
            (0.18, 0.34, "#3A2418", 0.20, 1.0),
            (0.56, 0.70, "#B98661", 0.14, -1.0),
        ]
    else:
        specs = [(0.30, 0.52, "#3A2418", 0.14, 1.0)]

    accents: list[dict] = []
    for start_t, end_t, color, opacity, side in specs:
        shifted = _offset_points(points, widths, side)
        frag_points, frag_widths = _fragment(shifted, widths, start_t, end_t)
        if len(frag_points) < 2:
            continue
        line_widths = [
            round(max(0.22, float(w) * (0.060 if order == 0 else 0.052)), 4)
            for w in frag_widths
        ]
        accents.append({
            "points": frag_points,
            "widths": line_widths,
            "fill": _alpha_hex(color, opacity * exposure),
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

    # Path-aligned accents now carry most anisotropy. Keep generic material grain
    # low so diagonal limbs are not stamped with a vertical trunk texture.
    for node in out.get("graph", {}).get("nodes", []):
        if node.get("id") == "wood_material":
            params = node.setdefault("params", {})
            params["grainAmount"] = min(float(params.get("grainAmount", 0.15)), 0.045)
            params["coarseAmount"] = max(float(params.get("coarseAmount", 0.15)), 0.13)

    planner = out.setdefault("planner", {})
    planner["branchGeometryContract"] = BRANCH_GEOMETRY_CONTRACT
    planner["branchGeometryV2"] = True
    planner["branchGeometryPathCount"] = len(base_paths)
    return out
