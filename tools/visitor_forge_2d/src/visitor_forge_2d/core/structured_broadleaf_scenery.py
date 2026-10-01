"""Branch-guided broadleaf renderer for Visitor Forge 2D.

This renderer exists to enforce the production rule documented in
TREE_VISUAL_REFERENCE_V1: a tree crown must not be one large blob with texture
painted over it.  The crown is assembled from authored wood structure, branch-
derived macro masses, smaller bridge groups, readable simple leaves, local
occlusion and restrained highlights.
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
    center = cfg.get("center", [recipe.get("crownCx", recipe["anchor"][0]), recipe["anchor"][1] * .48])
    radius = cfg.get("radius", [recipe["canvas"][0] * .34, recipe["canvas"][1] * .24])
    cx, cy = map(float, center)
    rx, ry = map(float, radius)
    if rx <= 8 or ry <= 8:
        raise ValueError("structured broadleaf radius is too small")
    density = cfg.get("density")
    if density is None:
        density = float(cfg.get("masses", 48)) / 48.0
    density = _clamp(float(density), .62, 1.38)
    return cx, cy, rx, ry, density


def _branch_groups(recipe: dict, rng: random.Random, view: str):
    """Return foliage macro groups driven by the authored branch skeleton."""
    cx, cy, rx, ry, density = _structure(recipe)
    branches = recipe.get("trunkBranches")
    if not isinstance(branches, list) or len(branches) < 3:
        raise ValueError("structured broadleaf requires at least three authored trunkBranches")

    phase = VIEW_PHASE[view]
    groups: list[dict] = []
    branch_groups = 0

    # The first branch is normally the trunk leader.  Every following branch
    # contributes several foliage masses along its curve instead of being
    # hidden behind one canopy envelope.
    for index, branch in enumerate(branches[1:]):
        p0 = tuple(map(float, branch["p0"]))
        p1 = tuple(map(float, branch.get("p1", branch["p0"])))
        p2 = tuple(map(float, branch["p2"]))
        for step_index, along in enumerate((.62, .86, 1.04)):
            x, y = organic._quad(p0, p1, p2, along)
            orbit = phase + index * .83 + step_index * .57
            x += math.cos(orbit) * rx * .035 + rng.uniform(-rx * .035, rx * .035)
            y += math.sin(orbit) * ry * .018 + rng.uniform(-ry * .025, ry * .025)
            scale = math.sqrt(density) * rng.uniform(.88, 1.12)
            groups.append({
                "x": x,
                "y": y,
                "rx": rx * (.205 if step_index < 2 else .225) * scale,
                "ry": ry * (.165 if step_index < 2 else .185) * scale,
                "source": "branch",
                "branch": index,
            })
            branch_groups += 1

    # Small bridge masses connect the crown without erasing the negative space
    # between branch families.  These are deliberately separate masks.
    bridge_layout = (
        (-.36, -.28, .22, .18),
        (-.05, -.42, .24, .18),
        (.30, -.29, .22, .18),
        (-.27, .02, .23, .19),
        (.09, -.02, .24, .20),
        (.34, .08, .21, .18),
        (-.10, .30, .22, .18),
        (.20, .29, .21, .18),
    )
    bridge_budget = max(4, min(len(bridge_layout), round(6 * density)))
    for index, (ox, oy, sx, sy) in enumerate(bridge_layout[:bridge_budget]):
        orbit = phase + index * .71
        groups.append({
            "x": cx + ox * rx + math.cos(orbit) * rx * .025 + rng.uniform(-2.0, 2.0),
            "y": cy + oy * ry + math.sin(orbit) * ry * .014 + rng.uniform(-1.5, 1.5),
            "rx": rx * sx * math.sqrt(density) * rng.uniform(.94, 1.06),
            "ry": ry * sy * math.sqrt(density) * rng.uniform(.94, 1.06),
            "source": "bridge",
            "branch": -1,
        })

    # A compact core behind the branch groups prevents accidental holes in the
    # crown centre but never becomes a full-size canopy blob.
    core_count = 2 if density < 1.16 else 3
    for index in range(core_count):
        groups.append({
            "x": cx + (-.12 + index * .12) * rx + rng.uniform(-2.0, 2.0),
            "y": cy + (.06 + index * .05) * ry + rng.uniform(-1.5, 1.5),
            "rx": rx * .22 * math.sqrt(density),
            "ry": ry * .18 * math.sqrt(density),
            "source": "core",
            "branch": -1,
        })

    groups.sort(key=lambda item: (item["y"], item["source"] != "branch"))
    return groups, branch_groups


def _group_mask(size: tuple[int, int], rng: random.Random, group: dict) -> Image.Image:
    mask = Image.new("L", size)
    brushes.leaf_cluster_broadleaf(
        mask, rng, group["x"], group["y"], group["rx"], group["ry"],
        satellites=2 if group["source"] == "branch" else 1,
        fill=255,
    )
    brushes.edge_breakup_stamp(
        mask, rng, group["x"], group["y"], max(group["rx"], group["ry"]),
        count=5 if group["source"] == "branch" else 3, fill=255,
    )
    # Cut only a few small windows.  The important negative space remains the
    # space between groups, not random holes across one large silhouette.
    brushes.silhouette_gap_cutter(
        mask, rng, group["x"], group["y"], group["rx"], group["ry"],
        count=1 if group["source"] == "core" else 2,
    )
    return mask


def _paint_simple_leaves(
    work: Image.Image,
    mask: Image.Image,
    rng: random.Random,
    palette: dict,
    group: dict,
    crown_center: tuple[float, float],
) -> int:
    """Paint tapered leaf primitives large enough to survive gameplay 1x."""
    cx, cy = group["x"], group["y"]
    rx, ry = group["rx"], group["ry"]
    crown_cx, crown_cy = crown_center
    pixels = mask.load()
    layer = Image.new("RGBA", mask.size)
    draw = ImageDraw.Draw(layer, "RGBA")
    area = max(1.0, rx * ry)
    target = max(18, min(70, round(area / 5.4)))
    painted = 0
    attempts = target * 4
    colors = (
        palette["mid_top"],
        palette["front_top"],
        palette["front_bottom"],
        palette["highlight"],
    )
    for _ in range(attempts):
        if painted >= target:
            break
        x = cx + rng.uniform(-.92, .92) * rx
        y = cy + rng.uniform(-.88, .88) * ry
        ix, iy = round(x * WORK_SCALE), round(y * WORK_SCALE)
        if not (0 <= ix < mask.width and 0 <= iy < mask.height) or pixels[ix, iy] < 210:
            continue
        lit = x < crown_cx + rx * .15 and y < crown_cy + ry * .12
        roll = rng.random()
        if lit and roll < .18:
            color = colors[3]
        elif lit and roll < .66:
            color = colors[1]
        elif y > cy + ry * .20 and roll < .48:
            color = colors[2]
        else:
            color = colors[0]
        # Leaves lean gently outward from the branch group.  Shapes are kept
        # in the 5-8 px range so Lanczos reduction does not turn them to mush.
        outward = math.atan2(y - crown_cy, x - crown_cx) * .24
        angle = outward + rng.uniform(-.72, .72)
        organic._draw_leaflet(
            draw, x, y,
            rng.uniform(5.0, 8.0),
            rng.uniform(1.8, 3.0),
            angle,
            color,
            rng.randint(188, 238),
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

    vertical = (cy - crown_cy) / max(1.0, ry * 3.4)
    if group["source"] == "core":
        top = palette["back_top"]
        bottom = palette["back_bottom"]
    else:
        warm = _clamp(.58 - vertical * .18, .22, .72)
        top = organic._mix_color(palette["mid_top"], palette["front_top"], warm)
        bottom = organic._mix_color(palette["mid_bottom"], palette["front_bottom"], warm * .55)
    organic._composite(work, mask, top, bottom, right_shade=.08)

    # Local lower-right occlusion gives every mass its own volume instead of
    # relying on random dark paint across a unified crown.
    shade = Image.new("L", work.size)
    brushes.interior_occlusion_patch(
        shade, rng, cx + rx * .24, cy + ry * .30,
        rx * .62, ry * .44, strength=92 if group["source"] != "core" else 120,
    )
    shade = ImageChops.multiply(shade, mask)
    organic._composite(work, shade, palette["occlusion"], palette["back_bottom"])

    # Restrained upper-left highlight.  It is a submass, not a broad glow.
    light = Image.new("L", work.size)
    brushes.leaf_cluster_round(
        light, rng, cx - rx * .24, cy - ry * .28,
        rx * .46, ry * .34, lobes=10, jitter=.16, fill=72,
    )
    light = ImageChops.multiply(light, mask)
    organic._composite(work, light, palette["highlight"], top, right_shade=.03)

    return _paint_simple_leaves(work, mask, rng, palette, group, crown_center)


def _visible_branch_pass(work: Image.Image, recipe: dict, palette: dict) -> None:
    """Restore selected branch segments over foliage so structure stays legible."""
    mask = Image.new("L", work.size)
    branches = recipe.get("trunkBranches", [])[1:]
    for index, branch in enumerate(branches):
        if index % 3 == 2:
            continue
        p0 = tuple(map(float, branch["p0"]))
        p1 = tuple(map(float, branch.get("p1", branch["p0"])))
        p2 = tuple(map(float, branch["p2"]))
        brushes.branch_tapered(
            mask, p0, p1, p2,
            max(1.0, float(branch.get("w0", 3.0)) * .34),
            max(.45, float(branch.get("w1", 1.0)) * .52),
            samples=34, fill=82,
        )
    if mask.getbbox():
        organic._composite(
            work, mask, palette["trunk_light"], palette["trunk_bottom"], right_shade=.08,
        )


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
    view_salt = 0x53B17 + int(round(VIEW_PHASE[view] * 1000))
    rng = random.Random(seed ^ view_salt)
    W, H = canvas[0] * WORK_SCALE, canvas[1] * WORK_SCALE
    palette = recipe["palette"]
    work = Image.new("RGBA", (W, H))

    # Contact shadow remains independent of crown paint and keeps the anchor
    # visually grounded on the canonical 2:1 tile.
    shadow = Image.new("L", (W, H))
    sw = int(recipe.get("shadowWidth", round(canvas[0] * .44)))
    ImageDraw.Draw(shadow).ellipse(
        ((anchor[0] - sw // 2) * WORK_SCALE, (anchor[1] - 8) * WORK_SCALE,
         (anchor[0] + sw // 2) * WORK_SCALE, (anchor[1] + 4) * WORK_SCALE),
        fill=112,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(2.1 * WORK_SCALE))
    shadow_rgba = Image.new("RGBA", (W, H), (*organic._hex(palette["ground_shadow"]), 0))
    shadow_rgba.putalpha(shadow)
    work.alpha_composite(shadow_rgba)

    # Wood is authored first.  Foliage groups are then attached to this
    # skeleton, rather than painting a full crown mask over it.
    organic._draw_trunk_and_bark(work, recipe, palette, W, H)

    cx, cy, _rx, _ry, density = _structure(recipe)
    groups, branch_group_count = _branch_groups(recipe, rng, view)
    leaf_count = 0
    for group in groups:
        leaf_count += _paint_group(work, rng, palette, group, (cx, cy))

    _visible_branch_pass(work, recipe, palette)

    frame = organic._alpha_safe_resize(work, tuple(canvas))
    # Do not apply organic._final_raster_pass here: broad random grain was one
    # of the sources of paint-speckle/noise in the old broadleaf result.  The
    # explicit leaf primitives above are the final-scale texture source.
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
        "authoringMode": "branch_guided_macro_subgroups_v1",
        "view": view,
        "yawDeg": int(recipe.get("rotation", {}).get("yawDeg", {}).get(view, DEFAULT_YAWS[view])),
        "camera": camera,
        "critic": {
            "singleCanopyBlob": False,
            "macroMassCount": len(groups),
            "branchDerivedMassCount": branch_group_count,
            "explicitLeafCount": leaf_count,
            "negativeSpace": "between_macro_groups",
            "randomFinalGrain": False,
            "density": density,
        },
        "brushes": [
            "branch_tapered",
            "leaf_cluster_broadleaf",
            "leaf_cluster_round",
            "silhouette_gap_cutter",
            "edge_breakup_stamp",
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
            frame, meta["anchor"],
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
        "lightingSpace": rotation.get("lightingSpace", "screen_camera_relative"),
        "generatedViews": True,
        "views": slots,
    }
    manifest_path = output_dir / f"{stem}_rotation.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

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
