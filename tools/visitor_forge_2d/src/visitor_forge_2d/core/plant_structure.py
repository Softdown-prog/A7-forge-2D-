"""A7 Structural Plant Engine V1.

Builds a deterministic canonical plant skeleton in lightweight 3D and projects the
same structure into the four City Horizon cardinal views.  This module owns plant
identity/branch topology only; painting is delegated to the Draw Engine graph.
"""
from __future__ import annotations

from dataclasses import dataclass
import math
import random
from typing import Iterable

PLANT_STRUCTURE_CONTRACT = "A7_PLANT_STRUCTURE_V1"
CARDINAL_VIEWS = ("south", "west", "north", "east")
_VIEW_ROTATION_DEG = {"south": 0.0, "west": 90.0, "north": 180.0, "east": 270.0}


@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float

    def lerp(self, other: "Vec3", t: float) -> "Vec3":
        return Vec3(
            self.x + (other.x - self.x) * t,
            self.y + (other.y - self.y) * t,
            self.z + (other.z - self.z) * t,
        )


@dataclass(frozen=True)
class Branch3D:
    branch_id: str
    parent_id: str | None
    order: int
    points: tuple[Vec3, ...]
    width_start: float
    width_end: float
    terminal: bool = False


@dataclass(frozen=True)
class PlantStructure:
    contract: str
    seed: int
    profile: dict
    branches: tuple[Branch3D, ...]

    @property
    def terminal_points(self) -> tuple[Vec3, ...]:
        return tuple(branch.points[-1] for branch in self.branches if branch.terminal)


@dataclass(frozen=True)
class PlantProjection:
    contract: str
    view: str
    canvas: tuple[int, int]
    anchor: tuple[int, int]
    paths: tuple[dict, ...]
    terminals: tuple[tuple[float, float], ...]
    branch_ids: tuple[str, ...]


def _range_pair(value: object, default: tuple[float, float]) -> tuple[float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return default
    lo, hi = float(value[0]), float(value[1])
    return (min(lo, hi), max(lo, hi))


def _profile(raw: dict | None) -> dict:
    source = dict(raw or {})
    return {
        "trunkHeight": float(source.get("trunkHeight", 1.0)),
        "trunkLean": float(source.get("trunkLean", 0.08)),
        "trunkWidth": float(source.get("trunkWidth", 0.115)),
        "crownStart": float(source.get("crownStart", 0.46)),
        "primaryCount": max(3, min(9, int(source.get("primaryCount", 6)))),
        "secondaryPerPrimary": max(1, min(4, int(source.get("secondaryPerPrimary", 2)))),
        "primaryLength": _range_pair(source.get("primaryLength"), (0.46, 0.70)),
        "secondaryLength": _range_pair(source.get("secondaryLength"), (0.22, 0.38)),
        "primaryRise": _range_pair(source.get("primaryRise"), (0.18, 0.34)),
        "secondaryRise": _range_pair(source.get("secondaryRise"), (0.08, 0.20)),
        "radialJitterDeg": float(source.get("radialJitterDeg", 18.0)),
        "bend": float(source.get("bend", 0.12)),
        "asymmetry": float(source.get("asymmetry", 0.16)),
    }


def _polar_xy(length: float, angle_deg: float) -> tuple[float, float]:
    angle = math.radians(angle_deg)
    return length * math.cos(angle), length * math.sin(angle)


def _curved_points(start: Vec3, end: Vec3, rng: random.Random, bend: float) -> tuple[Vec3, Vec3, Vec3]:
    mid = start.lerp(end, 0.52)
    dx, dy = end.x - start.x, end.y - start.y
    planar = max(1e-6, math.hypot(dx, dy))
    normal_x, normal_y = -dy / planar, dx / planar
    curve = rng.uniform(-bend, bend) * planar
    mid = Vec3(mid.x + normal_x * curve, mid.y + normal_y * curve, mid.z + rng.uniform(-0.03, 0.05))
    return (start, mid, end)


def generate_plant_structure(seed: int, profile: dict | None = None) -> PlantStructure:
    """Generate deterministic canonical 3D branch topology.

    The topology is intentionally species-neutral. Species/art intent changes the
    profile; renderers should not be added here.
    """
    cfg = _profile(profile)
    rng = random.Random(int(seed))
    branches: list[Branch3D] = []

    trunk_h = cfg["trunkHeight"]
    crown_start = max(0.25, min(0.78, cfg["crownStart"])) * trunk_h
    lean_x = rng.uniform(-cfg["trunkLean"], cfg["trunkLean"])
    lean_y = rng.uniform(-cfg["trunkLean"], cfg["trunkLean"])
    trunk_top = Vec3(lean_x, lean_y, trunk_h)
    trunk_mid = Vec3(lean_x * 0.32, lean_y * 0.32, crown_start * 0.78)
    branches.append(
        Branch3D(
            "trunk", None, 0,
            (Vec3(0.0, 0.0, 0.0), trunk_mid, trunk_top),
            cfg["trunkWidth"], cfg["trunkWidth"] * 0.34,
            False,
        )
    )

    primary_count = cfg["primaryCount"]
    base_phase = rng.uniform(0.0, 360.0)
    for index in range(primary_count):
        branch_id = f"p{index:02d}"
        t = 0.0 if primary_count == 1 else index / (primary_count - 1)
        start_z = crown_start + (0.12 + 0.48 * t + rng.uniform(-0.055, 0.055)) * (trunk_h - crown_start)
        start_z = min(trunk_h * 0.91, max(crown_start, start_z))
        start = Vec3(lean_x * start_z / trunk_h, lean_y * start_z / trunk_h, start_z)
        angle = base_phase + index * (360.0 / primary_count) + rng.uniform(-cfg["radialJitterDeg"], cfg["radialJitterDeg"])
        length = rng.uniform(*cfg["primaryLength"]) * (1.0 + rng.uniform(-cfg["asymmetry"], cfg["asymmetry"]))
        rise = rng.uniform(*cfg["primaryRise"])
        off_x, off_y = _polar_xy(length, angle)
        end = Vec3(start.x + off_x, start.y + off_y, min(trunk_h * 1.15, start.z + rise))
        primary_points = _curved_points(start, end, rng, cfg["bend"])
        branches.append(
            Branch3D(
                branch_id, "trunk", 1, primary_points,
                cfg["trunkWidth"] * rng.uniform(0.42, 0.58),
                cfg["trunkWidth"] * rng.uniform(0.13, 0.22),
                cfg["secondaryPerPrimary"] == 0,
            )
        )

        for child_index in range(cfg["secondaryPerPrimary"]):
            child_id = f"{branch_id}s{child_index:02d}"
            attach_t = 0.62 + child_index * (0.22 / max(1, cfg["secondaryPerPrimary"] - 1))
            child_start = primary_points[1].lerp(primary_points[2], attach_t)
            fan_sign = -1.0 if child_index % 2 == 0 else 1.0
            fan = fan_sign * rng.uniform(22.0, 54.0) + rng.uniform(-10.0, 10.0)
            child_angle = angle + fan
            child_length = rng.uniform(*cfg["secondaryLength"]) * (1.0 + rng.uniform(-cfg["asymmetry"], cfg["asymmetry"]))
            child_rise = rng.uniform(*cfg["secondaryRise"])
            cx, cy = _polar_xy(child_length, child_angle)
            child_end = Vec3(child_start.x + cx, child_start.y + cy, min(trunk_h * 1.23, child_start.z + child_rise))
            child_points = _curved_points(child_start, child_end, rng, cfg["bend"] * 1.18)
            branches.append(
                Branch3D(
                    child_id, branch_id, 2, child_points,
                    cfg["trunkWidth"] * rng.uniform(0.16, 0.22),
                    cfg["trunkWidth"] * rng.uniform(0.045, 0.075),
                    True,
                )
            )

    return PlantStructure(PLANT_STRUCTURE_CONTRACT, int(seed), cfg, tuple(branches))


def _rotate_xy(point: Vec3, degrees: float) -> Vec3:
    angle = math.radians(degrees)
    c, s = math.cos(angle), math.sin(angle)
    return Vec3(point.x * c - point.y * s, point.x * s + point.y * c, point.z)


def _project_point(point: Vec3, anchor: tuple[int, int], scale: float) -> tuple[float, float]:
    # CH_CAMERA_V1-friendly 2:1 ground projection: world diagonals become 2:1 screen diagonals.
    sx = (point.x - point.y) * scale * 0.72
    sy_ground = (point.x + point.y) * scale * 0.36
    sy_height = point.z * scale * 1.10
    return (anchor[0] + sx, anchor[1] + sy_ground - sy_height)


def project_plant_structure(
    structure: PlantStructure,
    view: str,
    canvas: tuple[int, int] = (256, 320),
    anchor: tuple[int, int] = (128, 310),
    scale: float = 148.0,
) -> PlantProjection:
    """Project one canonical plant into a cardinal City Horizon view."""
    name = str(view).lower()
    if name not in _VIEW_ROTATION_DEG:
        raise ValueError(f"view must be one of {CARDINAL_VIEWS}")
    rotation = _VIEW_ROTATION_DEG[name]
    paths: list[dict] = []
    terminals: list[tuple[float, float]] = []
    branch_ids: list[str] = []

    for branch in structure.branches:
        points_2d = [_project_point(_rotate_xy(point, rotation), anchor, scale) for point in branch.points]
        width_scale = scale * 0.64
        paths.append(
            {
                "branchId": branch.branch_id,
                "parentId": branch.parent_id,
                "order": branch.order,
                "points": [[round(x, 3), round(y, 3)] for x, y in points_2d],
                "widthStart": round(max(0.8, branch.width_start * width_scale), 3),
                "widthEnd": round(max(0.55, branch.width_end * width_scale), 3),
                "fill": "#795337",
                "outline": "#4A2F1D" if branch.order <= 1 else None,
                "outlineWidth": 0.9 if branch.order == 0 else (0.6 if branch.order == 1 else 0.0),
            }
        )
        branch_ids.append(branch.branch_id)
        if branch.terminal:
            terminals.append(points_2d[-1])

    cleaned_paths = []
    for path in paths:
        cleaned = dict(path)
        if cleaned["outline"] is None:
            cleaned.pop("outline")
            cleaned.pop("outlineWidth")
        cleaned_paths.append(cleaned)

    return PlantProjection(
        PLANT_STRUCTURE_CONTRACT,
        name,
        tuple(canvas),
        tuple(anchor),
        tuple(cleaned_paths),
        tuple((round(x, 3), round(y, 3)) for x, y in terminals),
        tuple(branch_ids),
    )


def project_four_views(
    structure: PlantStructure,
    canvas: tuple[int, int] = (256, 320),
    anchor: tuple[int, int] = (128, 310),
    scale: float = 148.0,
) -> dict[str, PlantProjection]:
    return {
        view: project_plant_structure(structure, view, canvas=canvas, anchor=anchor, scale=scale)
        for view in CARDINAL_VIEWS
    }


def topology_signature(branches: Iterable[Branch3D]) -> tuple[tuple[str, str | None, int], ...]:
    """Stable identity signature used by tests/workers to prove cross-view coherence."""
    return tuple((branch.branch_id, branch.parent_id, branch.order) for branch in branches)
