"""Branch-guided broadleaf renderer for Visitor Forge 2D.

V2 refinement removes the detached edge stamps, punched silhouette holes and
foreground branch overlays that made the first structured pass look synthetic.
The crown is now assembled from overlapping branch-guided masses and restrained
leaf detail, while wood remains behind the foliage and is revealed naturally
through controlled negative space.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from . import brushes
from . import organic_scenery as organic

CONTRACT = organic.CONTRACT
CAMERA_CONTRACT = organic.CAMERA_CONTRACT
ROTATION_CONTRACT = organic.ROTATION_CONTRACT
WORK_SCALE = organic.WORK_SCALE
VALID_VIEWS = organic.VALID_VIEWS
DEFAULT_YAWS = organic.DEFAULT_YAWS
VIEW_PHASE = organic.VIEW_PHASE


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _structure(recipe: dict) -> tuple[float, float, float, float, float]:
    cfg = recipe.get("broadleafStructure", {})
    center = cfg.get(
        "center",
        [recipe.get("crownCx", recipe["anchor"][0]), recipe["anchor"][1] * .50],
    )
    radius = cfg.get(
        "radius",
        [recipe["canvas"][0] * .36, recipe["canvas"][1] * .25],
    )
    cx, cy = map(float, center)
    rx, ry = map(float, radius)
    if rx <= 8 or ry <= 8:
        raise ValueError("structured broadleaf radius is too small")
    density = cfg.get("density")
    if density is None:
        density = float(cfg.get("masses", 48)) / 48.0
    density = _clamp(float(density), .68, 1.42)
    return cx, cy, rx, ry, density


def _branch_groups(recipe: dict, rng: random.Random, view: str):
    """Build overlapping crown masses from authored branches plus crown-fill groups."""
    cx, cy, rx, ry, density = _structure(recipe)
    branches = recipe.get("trunkBranches")
    if not isinstance(branches, list) or len(branches) < 3:
        raise ValueError("structured broadleaf requires at least three authored trunkBranches")

    phase = VIEW_PHASE[view]
    groups: list[dict] = []
    branch_group_count = 0

    # Branch-attached groups.  Earlier passes used small separated blobs around
    # the tips; V2 uses slightly larger overlapping masses along the branch arc.
    for index, branch in enumerate(branches[1:]):
        p0 = tuple(map(float, branch["p0"]))
        p1 = tuple(map(float, branch.get("p1", branch["p0"])))
        p2 = tuple(map(float, branch["p2"]))
        for step_index, along in enumerate((.50, .76, 1.00)):
            x, y = organic._quad(p0, p1, p2, along)
            orbit = phase + index * .79 + step_index * .51
            x += math.cos(orbit) * rx * .022 + rng.uniform(-rx * .022, rx * .022)
            y += math.sin(orbit) * ry * .012 + rng.uniform(-ry * .018, ry * .018)
            scale = math.sqrt(density) * rng.uniform(.94, 1.08)
            groups.append({
                "x": x,
                "y": y,
                "rx": rx * (.245 if step_index < 2 else .275) * scale,
                "ry": ry * (.205 if step_index < 2 else .225) * scale,
                "source": "branch",
                "branch": index,
            })
            branch_group_count += 1

    # Crown-fill masses create a coherent adult crown without a single canopy
    # mask.  Their overlap hides the mechanical Y-shaped skeleton but keeps
    # readable valleys and depth between branch families.
    fill_layout = (
        (-.48, -.18, .28, .23),
        (-.24, -.45, .29, .23),
        (.05, -.52, .30, .24),
        (.34, -.39, .28, .23),
        (.52, -.12, .26, .22),
        (-.48, .14, .28, .24),
        (-.20, .05, .30, .25),
        (.12, .03, .31, .25),
        (.42, .14, .28, .24),
        (-.28, .35, .28, .23),
        (.03, .40, .30, .24),
        (.30, .34, .27, .23),
    )
    fill_budget = max(8, min(len(fill_layout), round(10 * density)))
    for index, (ox, oy, sx, sy) in enumerate(fill_layout[:fill_budget]):
        orbit = phase + index * .63
        groups.append({
            "x": cx + ox * rx + math.cos(orbit) * rx * .016 + rng.uniform(-1.6, 1.6),
            "y": cy + oy * ry + math.sin(orbit) * ry * .010 + rng.uniform(-1.2, 1.2),
            "rx": rx * sx * math.sqrt(density) * rng.uniform(.97, 1.05),
            "ry": ry * sy * math.sqrt(density) * rng.uniform(.97, 1.05),
            "source": "fill",
            "branch": -1,
        })

    # Rear core groups live behind the crown and prevent empty central cavities.
    for index, offset in enumerate((-.12, .08, .26)):
        groups.append({
            "x": cx + offset * rx + rng.uniform(-1.2, 1.2),
            "y": cy + (.08 + index * .035) * ry + rng.uniform(-1.0, 1.0),
            "rx": rx * .255 * math.sqrt(density),
            "ry": ry * .215 * math.sqrt(density),
            "source": "core",
            "branch": -1,
        })

    # Paint back-to-front using screen y.  Stable secondary key keeps the same
    # hierarchy between runs.
    groups.sort(key=lambda item: (item["y"], item["source"] == "core"))
    return groups, branch_group_count


def _group_mask(size: tuple[int, int], rng: random.Random, group: dict) -> Image.Image:
    """Produce one connected irregular mass without detached circles or punched holes."""
    mask = Image.new("L", size)
    brushes.leaf_cluster_broadleaf(
        mask,
        rng,
        group["x"],
        group["y"],
        group["rx"],
        group["ry"],
        satellites=2 if group["source"] == "branch" else 1,
        fill=255,
    )
    # A tiny dilation fuses satellite joins after supersampling while keeping
    # the perimeter organic.  V1's edge_breakup_stamp and gap_cutter are
    # intentionally not used: they created floating green dots and black holes.
    return mask.filter(ImageFilter.MaxFilter(3))


def _paint_simple_leaves(
    work: Image.Image,
    mask: Image.Image,
    rng: random.Random,
    palette: dict,
    group: dict,
    crown_center: tuple[float, float],
) -> int:
    """Paint readable tapered leaves with restrained contrast at gameplay 1x."""
    cx, cy = group["x"], group["y"]
    rx, ry = group["rx"], group["ry"]
    crown_cx, crown_cy = crown_center
    pixels = mask.load()
    layer = Image.new("RGBA", mask.size)
    draw = ImageDraw.Draw(layer, "RGBA")
    area = max(1.0, rx * ry)
    target = max(14, min(52, round(area / 8.2)))
    painted = 0
    attempts = target * 5

    for _ in range(attempts):
        if painted >= target:
            break
        x = cx + rng.uniform(-.90, .90) * rx
        y = cy + rng.uniform(-.86, .86) * ry
        ix, iy = round(x * WORK_SCALE), round(y * WORK_SCALE)
        if not (0 <= ix < mask.width and 0 <= iy < mask.height) or pixels[ix, iy] < 215:
            continue

        top_left = x < crown_cx + rx * .10 and y < crown_cy + ry * .08
        roll = rng.random()
        if top_left and roll < .12:
            color = palette["highlight"]
        elif top_left and roll < .52:
            color = palette["front_top"]
        elif y > cy + ry * .20 and roll < .42:
            color = palette["front_bottom"]
        else:
            color = palette["mid_top"]

        outward = math.atan2(y - crown_cy, x - crown_cx) * .18
        organic._draw_leaflet(
            draw,
            x,
            y,
            rng.uniform(4.6, 7.0),
            rng.uniform(1.7, 2.7),
            outward + rng.uniform(-.62, .62),
            color,
            rng.randint(176, 222),
        )
        painted += 1

    layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
    work.alpha_composite(layer)
    return painted


def _paint_group(
    work: Image.Image,
    rng: random.Random,
    palette: dict,
    group: dict,
    crown_center: tuple[float, float],
) -> int:
    mask = _group_mask(work.size, rng, group)
    cx, cy = group["x"], group["y"]
    rx, ry = group["rx"], group["ry"]
    crown_cx, crown_cy = crown_center

    if group["source"] == "core":
        top = organic._mix_color(palette["back_top"], palette["mid_top"], .30)
        bottom = palette["back_bottom"]
    else:
        vertical = (cy - crown_cy) / max(1.0, ry * 3.8)
        warm = _clamp(.48 - vertical * .14, .24, .58)
        top = organic._mix_color(palette["mid_top"], palette["front_top"], warm)
        bottom = organic._mix_color(
            palette["mid_bottom"], palette["front_bottom"], warm * .42
        )
    organic._composite(work, mask, top, bottom, right_shade=.065)

    # Smaller, softer lower-right occlusion prevents the dark ring/spot look.
    shade = Image.new("L", work.size)
    brushes.interior_occlusion_patch(
        shade,
        rng,
        cx + rx * .21,
        cy + ry * .27,
        rx * .54,
        ry * .38,
        strength=72 if group["source"] != "core" else 95,
    )
    shade = ImageChops.multiply(shade, mask)
    organic._composite(work, shade, palette["occlusion"], palette["back_bottom"])

    # Highlights are compact and semi-transparent; V1's broad light patches
    # were reading as large paint blotches.
    light = Image.new("L", work.size)
    brushes.leaf_cluster_round(
        light,
        rng,
        cx - rx * .22,
        cy - ry * .25,
        rx * .36,
        ry * .26,
        lobes=10,
        jitter=.13,
        fill=48,
    )
    light = ImageChops.multiply(light, mask)
    organic._composite(work, light, palette["highlight"], top, right_shade=.02)

    return _paint_simple_leaves(work, mask, rng, palette, group, crown_center)


def render(recipe: dict, view: str = "south"):
    if recipe.get("contract") != CONTRACT:
        raise ValueError(f"recipe must declare {CONTRACT}")
    camera = recipe.get("camera", {})
    if camera.get("contract") != CAMERA_CONTRACT or camera.get("tile") != [128, 64]:
        raise ValueError("structured broadleaf scenery requires CH_CAMERA_V1 on the 128x64 grid")
    if view not in VALID_VIEWS:
        raise ValueError(f"view must be one of {VALID_VIEWS}")
    if recipe.get("crownStyle") != "broadleaf":
        raise ValueError("structured broadleaf scenery requires crownStyle broadleaf")

    canvas = recipe.get("canvas", [256, 320])
    anchor = recipe.get("anchor", [canvas[0] // 2, canvas[1] - 9])
    seed = int(recipe.get("seed", 1))
    view_salt = 0x71B2D + int(round(VIEW_PHASE[view] * 1000))
    rng = random.Random(seed ^ view_salt)
    W, H = canvas[0] * WORK_SCALE, canvas[1] * WORK_SCALE
    palette = recipe["palette"]
    work = Image.new("RGBA", (W, H))

    shadow = Image.new("L", (W, H))
    sw = int(recipe.get("shadowWidth", round(canvas[0] * .42)))
    ImageDraw.Draw(shadow).ellipse(
        (
            (anchor[0] - sw // 2) * WORK_SCALE,
            (anchor[1] - 8) * WORK_SCALE,
            (anchor[0] + sw // 2) * WORK_SCALE,
            (anchor[1] + 4) * WORK_SCALE,
        ),
        fill=104,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(2.0 * WORK_SCALE))
    shadow_rgba = Image.new(
        "RGBA", (W, H), (*organic._hex(palette["ground_shadow"]), 0)
    )
    shadow_rgba.putalpha(shadow)
    work.alpha_composite(shadow_rgba)

    # Wood stays behind foliage.  V1 restored branch strokes over the crown,
    # which exposed a mechanical Y-shaped skeleton in every view.
    organic._draw_trunk_and_bark(work, recipe, palette, W, H)

    cx, cy, _rx, _ry, density = _structure(recipe)
    groups, branch_group_count = _branch_groups(recipe, rng, view)
    leaf_count = 0
    for group in groups:
        leaf_count += _paint_group(work, rng, palette, group, (cx, cy))

    frame = organic._alpha_safe_resize(work, tuple(canvas))
    bounds = frame.getchannel("A").getbbox()
    return frame, {
        "contract": CONTRACT,
        "id": recipe["id"],
        "canvas": canvas,
        "anchor": anchor,
        "bounds": list(bounds),
        "seed": seed,
        "crownStyle": "broadleaf",
        "sceneryType": "structured_broadleaf",
        "authoringMode": "branch_guided_overlapping_groups_v2",
        "view": view,
        "yawDeg": int(
            recipe.get("rotation", {}).get("yawDeg", {}).get(
                view, DEFAULT_YAWS[view]
            )
        ),
        "camera": camera,
        "critic": {
            "singleCanopyBlob": False,
            "macroMassCount": len(groups),
            "branchDerivedMassCount": branch_group_count,
            "explicitLeafCount": leaf_count,
            "negativeSpace": "between_overlapping_groups",
            "randomFinalGrain": False,
            "detachedEdgeStamps": False,
            "punchedGapCutters": False,
            "foregroundBranchOverlay": False,
            "density": density,
        },
        "brushes": [
            "branch_tapered",
            "leaf_cluster_broadleaf",
            "leaf_cluster_round",
            "interior_occlusion_patch",
            "tapered_simple_leaf",
        ],
        "runtimePromotion": False,
        "artApproved": False,
    }


def export(recipe_path: Path, output_dir: Path):
    raw = recipe_path.read_bytes()
    recipe = json.loads(raw)
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = recipe["id"]
    rotation = recipe.get("rotation", {})
    views = rotation.get("views", ["south"])
    if not views or any(view not in VALID_VIEWS for view in views):
        raise ValueError(f"rotation views must be a non-empty subset of {VALID_VIEWS}")

    slots = {}
    first_meta = None
    for view in views:
        frame, meta = render(recipe, view)
        first_meta = first_meta or meta
        source = output_dir / f"{stem}_{view}_source.png"
        final = output_dir / f"{stem}_{view}.png"
        frame.save(source)
        final.write_bytes(source.read_bytes())
        organic.review_board(frame).save(output_dir / f"{stem}_{view}_review.png")
        organic.isometric_board(
            frame,
            meta["anchor"],
            f"CH_CAMERA_V1 / {view} / yaw {meta['yawDeg']} / 128x64",
        ).save(output_dir / f"{stem}_{view}_isometric_review.png")
        slots[view] = {
            "path": str(final),
            "source": str(source),
            "yawDeg": meta["yawDeg"],
            "sha256": hashlib.sha256(final.read_bytes()).hexdigest(),
            "finish": None,
        }

    canonical_view = "south" if "south" in slots else views[0]
    canonical = output_dir / f"{stem}.png"
    canonical.write_bytes(Path(slots[canonical_view]["path"]).read_bytes())
    with Image.open(canonical) as image:
        final_frame = image.convert("RGBA")
    review = output_dir / f"{stem}_review.png"
    iso = output_dir / f"{stem}_isometric_review.png"
    organic.review_board(final_frame).save(review)
    organic.isometric_board(final_frame, first_meta["anchor"]).save(iso)

    manifest = {
        "contract": ROTATION_CONTRACT,
        "id": stem,
        "mode": rotation.get("mode", "procedural_quarter_turns"),
        "lightingSpace": rotation.get(
            "lightingSpace", "screen_camera_relative"
        ),
        "generatedViews": True,
        "views": slots,
    }
    manifest_path = output_dir / f"{stem}_rotation.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )

    meta = dict(first_meta)
    meta.update({
        "recipe": str(recipe_path),
        "recipeSha256": hashlib.sha256(raw).hexdigest(),
        "png": str(canonical),
        "review": str(review),
        "isometricReview": str(iso),
        "rotationManifest": str(manifest_path),
        "views": slots,
    })
    report = output_dir / f"{stem}.json"
    report.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    return {
        "png": str(canonical),
        "review": str(review),
        "isometricReview": str(iso),
        "metadata": str(report),
        "rotationManifest": str(manifest_path),
        "views": {view: slot["path"] for view, slot in slots.items()},
    }
