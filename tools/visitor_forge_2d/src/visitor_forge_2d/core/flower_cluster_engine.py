"""A7 field-aware flowering cluster engine.

This engine lifts the reusable flowering grammar already proven by the approved
Ipê Amarelo asset into Node Graph V2. It remains species-neutral: callers
provide density, palette and scale; this module provides deterministic macro
clusters, micro-blossoms, warm internal occlusion and negative-space windows.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

from PIL import Image, ImageChops, ImageDraw

from . import brushes, flowering_brushes

FLOWER_CLUSTER_CONTRACT = "A7_FLOWER_CLUSTER_ENGINE_V1"
_WORK_SCALE = 4


def _hex(value: str) -> tuple[int, int, int]:
    text = str(value).lstrip("#")
    if len(text) != 6:
        raise ValueError("flower palette colors must be #RRGGBB")
    return tuple(int(text[i:i + 2], 16) for i in (0, 2, 4))


def _pair(value, default: tuple[float, float]) -> tuple[float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return default
    a, b = float(value[0]), float(value[1])
    return (min(a, b), max(a, b))


def _palette(raw: dict | None) -> dict[str, str]:
    source = dict(raw or {})
    return {
        "back_top": str(source.get("backTop", "#D59B08")),
        "back_bottom": str(source.get("backBottom", "#9A6700")),
        "mid_top": str(source.get("midTop", "#F2B705")),
        "mid_bottom": str(source.get("midBottom", "#C38300")),
        "front_top": str(source.get("frontTop", "#FFD21A")),
        "highlight": str(source.get("highlight", "#FFE96A")),
        "occlusion": str(source.get("occlusion", "#62431B")),
    }


def _lerp_color(a: str, b: str, t: float) -> tuple[int, int, int]:
    ca, cb = _hex(a), _hex(b)
    t = max(0.0, min(1.0, float(t)))
    return tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))


def _masked_gradient(mask: Image.Image, top: str, bottom: str, *, alpha: int = 255) -> Image.Image:
    width, height = mask.size
    gradient = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(gradient)
    for y in range(height):
        rgb = _lerp_color(top, bottom, y / max(1, height - 1))
        draw.line((0, y, width, y), fill=(*rgb, alpha))
    gradient.putalpha(ImageChops.multiply(gradient.getchannel("A"), mask))
    return gradient


def _sample_l(field: Image.Image | None, x: float, y: float, default: int = 255) -> int:
    if field is None:
        return default
    ix = max(0, min(field.width - 1, int(round(x))))
    iy = max(0, min(field.height - 1, int(round(y))))
    return int(field.getpixel((ix, iy)))


@dataclass(frozen=True)
class FlowerGroup:
    x: float
    y: float
    rx: float
    ry: float
    density: float
    depth: float


class FlowerClusterEngineV1:
    """Deterministically distribute and paint flowering macro-groups."""

    contract = FLOWER_CLUSTER_CONTRACT

    def __init__(self, seed: int):
        self.seed = int(seed)

    def _place_groups(
        self,
        density_field: Image.Image,
        *,
        avoid_field: Image.Image | None,
        depth_field: Image.Image | None,
        count: int,
        bounds: list[int] | tuple[int, int, int, int] | None,
        min_distance: float,
        radius_x: tuple[float, float],
        radius_y: tuple[float, float],
        max_attempts: int,
    ) -> tuple[list[FlowerGroup], int]:
        rng = random.Random(self.seed)
        width, height = density_field.size
        if bounds is None:
            left, top, right, bottom = 0, 0, width - 1, height - 1
        else:
            left, top, right, bottom = (int(v) for v in bounds)
            left = max(0, min(width - 1, left))
            right = max(left, min(width - 1, right))
            top = max(0, min(height - 1, top))
            bottom = max(top, min(height - 1, bottom))
        placed: list[FlowerGroup] = []
        attempts = 0
        target = max(0, int(count))
        min_d2 = max(0.0, float(min_distance)) ** 2
        density = density_field if density_field.mode == "L" else density_field.convert("L")
        avoid = None if avoid_field is None else (avoid_field if avoid_field.mode == "L" else avoid_field.convert("L"))
        depth = None if depth_field is None else (depth_field if depth_field.mode == "L" else depth_field.convert("L"))

        while len(placed) < target and attempts < max_attempts:
            attempts += 1
            x = rng.uniform(left, right)
            y = rng.uniform(top, bottom)
            d = _sample_l(density, x, y, 0) / 255.0
            if d <= 0.01 or rng.random() > d:
                continue
            if avoid is not None and _sample_l(avoid, x, y, 0) >= 128:
                continue
            if min_d2 > 0.0 and any((x - group.x) ** 2 + (y - group.y) ** 2 < min_d2 for group in placed):
                continue
            z = _sample_l(depth, x, y, 128) / 255.0 if depth is not None else 0.5
            scale = 0.88 + d * 0.18 + z * 0.05
            placed.append(FlowerGroup(
                x=x,
                y=y,
                rx=rng.uniform(*radius_x) * scale,
                ry=rng.uniform(*radius_y) * scale,
                density=d,
                depth=z,
            ))
        return placed, attempts

    def scatter(
        self,
        image: Image.Image,
        density_field: Image.Image,
        *,
        avoid_field: Image.Image | None = None,
        depth_field: Image.Image | None = None,
        count: int = 12,
        bounds=None,
        min_distance: float = 10.0,
        radius_x=(11.0, 16.0),
        radius_y=(8.0, 12.0),
        palette: dict | None = None,
        blossom_density: float = 1.0,
        gap_windows: tuple[int, int] | list[int] = (2, 3),
        edge_spray_probability: float = 0.42,
        max_attempts: int = 24000,
    ) -> dict:
        if image.mode != "RGBA":
            raise ValueError("flower cluster image must be RGBA")
        if density_field.size != image.size:
            raise ValueError("flower density field must match image size")
        if avoid_field is not None and avoid_field.size != image.size:
            raise ValueError("flower avoid field must match image size")
        if depth_field is not None and depth_field.size != image.size:
            raise ValueError("flower depth field must match image size")

        rx_range = _pair(radius_x, (11.0, 16.0))
        ry_range = _pair(radius_y, (8.0, 12.0))
        gap_range_raw = _pair(gap_windows, (2.0, 3.0))
        gap_range = (max(0, round(gap_range_raw[0])), max(0, round(gap_range_raw[1])))
        pal = _palette(palette)
        groups, attempts = self._place_groups(
            density_field,
            avoid_field=avoid_field,
            depth_field=depth_field,
            count=count,
            bounds=bounds,
            min_distance=min_distance,
            radius_x=rx_range,
            radius_y=ry_range,
            max_attempts=max(1, int(max_attempts)),
        )

        width, height = image.size
        work_size = (width * _WORK_SCALE, height * _WORK_SCALE)
        layer = Image.new("RGBA", work_size, (0, 0, 0, 0))
        rng = random.Random(self.seed ^ 0x7A11F10)

        for group in sorted(groups, key=lambda item: (item.y, item.x)):
            mask = Image.new("L", work_size, 0)
            brushes.leaf_cluster_broadleaf(mask, rng, group.x, group.y, group.rx, group.ry, satellites=4, fill=255)
            brushes.edge_breakup_stamp(mask, rng, group.x, group.y, max(group.rx, group.ry), count=7, fill=255)
            flowering_brushes.blossom_gap_windows(
                mask,
                rng,
                (group.x, group.y),
                (group.rx, group.ry),
                count=rng.randint(gap_range[0], gap_range[1]) if gap_range[1] >= gap_range[0] else gap_range[0],
            )

            layer.alpha_composite(_masked_gradient(mask, pal["mid_top"], pal["mid_bottom"], alpha=236))

            shade = Image.new("L", work_size, 0)
            brushes.interior_occlusion_patch(
                shade,
                rng,
                group.x + group.rx * 0.16,
                group.y + group.ry * 0.23,
                group.rx * 0.62,
                group.ry * 0.42,
                strength=106,
            )
            shade = ImageChops.multiply(shade, mask)
            shade_rgba = Image.new("RGBA", work_size, (*_hex(pal["occlusion"]), 0))
            shade_rgba.putalpha(shade)
            layer.alpha_composite(shade_rgba)

            blossoms = Image.new("RGBA", work_size, (0, 0, 0, 0))
            blossom_count = max(24, round((group.rx * group.ry) / 4.1 * max(0.25, float(blossom_density))))
            flowering_brushes.flower_cluster_small_round(
                blossoms,
                rng,
                mask,
                (group.x, group.y),
                (group.rx, group.ry),
                (pal["back_top"], pal["mid_top"], pal["front_top"]),
                count=blossom_count,
                highlight_color=pal["highlight"],
                shadow_color=pal["back_bottom"],
            )
            layer.alpha_composite(blossoms)

            if rng.random() < max(0.0, min(1.0, float(edge_spray_probability))):
                spray = Image.new("RGBA", work_size, (0, 0, 0, 0))
                flowering_brushes.flower_spray(
                    spray,
                    rng,
                    (group.x - group.rx * 0.30, group.y - group.ry * 0.36),
                    (pal["mid_top"], pal["front_top"]),
                    radius=max(5.0, group.rx * 0.52),
                    blossoms=8,
                    highlight_color=pal["highlight"],
                )
                layer.alpha_composite(spray)

        image.alpha_composite(layer.resize(image.size, Image.Resampling.LANCZOS))
        return {
            "contract": FLOWER_CLUSTER_CONTRACT,
            "requestedGroups": max(0, int(count)),
            "placedGroups": len(groups),
            "attempts": attempts,
            "blossomStyle": "many_small_round",
            "negativeSpaceWindows": True,
            "internalOcclusion": True,
            "supersample": _WORK_SCALE,
        }
