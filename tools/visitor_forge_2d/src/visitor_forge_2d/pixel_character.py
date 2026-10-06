"""Pixel-native character generator for A7 Forge 2D.

The renderer works directly on the final pixel grid. It intentionally avoids
supersampling, antialiasing and image scaling so pixel clusters remain explicit
and deterministic.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from .animation import ANIMATION_CONTRACT, package_animation


PIXEL_CHARACTER_CONTRACT = "A7_FORGE_2D_PIXEL_CHARACTER_V1"
DIRECTIONS = ("south", "east", "north", "west")
DEFAULT_PALETTE = {
    "outline": "#17202a",
    "skin": "#e7ad82",
    "hair": "#4c3328",
    "shirt": "#3f78bd",
    "shirtShadow": "#2d5b91",
    "pants": "#33435a",
    "pantsShadow": "#253244",
    "shoes": "#20262e",
}


def _hex_rgba(value: object, label: str) -> tuple[int, int, int, int]:
    text = str(value or "")
    if len(text) != 7 or not text.startswith("#"):
        raise ValueError(f"{label} must be #RRGGBB")
    try:
        return tuple(int(text[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    except ValueError as exc:
        raise ValueError(f"{label} must be #RRGGBB") from exc


def _safe_id(value: object) -> str:
    text = str(value or "").strip()
    if not text or any(ch not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-" for ch in text):
        raise ValueError("character id must contain only letters, digits, '_' or '-'")
    return text


def _load_recipe(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("contract") != PIXEL_CHARACTER_CONTRACT:
        raise ValueError(f"expected contract {PIXEL_CHARACTER_CONTRACT}")
    return data


def _palette(recipe: dict[str, Any]) -> dict[str, tuple[int, int, int, int]]:
    raw = dict(DEFAULT_PALETTE)
    supplied = recipe.get("palette", {})
    if not isinstance(supplied, dict):
        raise ValueError("palette must be an object")
    unknown = sorted(set(supplied) - set(DEFAULT_PALETTE))
    if unknown:
        raise ValueError(f"unsupported palette slots: {unknown}")
    raw.update({key: str(value) for key, value in supplied.items()})
    return {key: _hex_rgba(value, f"palette.{key}") for key, value in raw.items()}


def _rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: tuple[int, int, int, int]) -> None:
    draw.rectangle(box, fill=fill)


def _pixel_character(
    size: tuple[int, int],
    direction: str,
    pose: str,
    colors: dict[str, tuple[int, int, int, int]],
) -> Image.Image:
    if direction not in DIRECTIONS:
        raise ValueError(f"unsupported direction: {direction}")
    width, height = size
    if width < 24 or height < 32:
        raise ValueError("pixel character canvas must be at least 24x32")
    if width > 128 or height > 192:
        raise ValueError("pixel character canvas is intentionally capped at 128x192")

    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    cx = width // 2
    ground = height - 2
    scale = max(1, min(width // 16, height // 24))
    # Keep all motion on the integer grid.
    phase = {"idle": 0, "walk_0": -1, "walk_1": 0, "walk_2": 1, "walk_3": 0}.get(pose)
    if phase is None:
        raise ValueError(f"unsupported pixel pose: {pose}")

    bob = -scale if pose in ("walk_1", "walk_3") else 0
    body_bottom = ground - 5 * scale + bob
    torso_top = body_bottom - 7 * scale
    head_top = torso_top - 6 * scale

    outline = colors["outline"]
    skin = colors["skin"]
    hair = colors["hair"]
    shirt = colors["shirt"]
    shirt_shadow = colors["shirtShadow"]
    pants = colors["pants"]
    pants_shadow = colors["pantsShadow"]
    shoes = colors["shoes"]

    # Walking uses discrete opposite limb offsets; no interpolated pixels.
    leg_shift = phase * 2 * scale
    arm_shift = -phase * scale

    if direction in ("south", "north"):
        head_half = 3 * scale
        torso_half = 3 * scale
        # Legs behind torso, alternating contact.
        left_x = cx - 2 * scale + leg_shift
        right_x = cx + scale - leg_shift
        _rect(draw, (left_x - scale, body_bottom, left_x, ground - scale), outline)
        _rect(draw, (left_x, body_bottom, left_x + scale, ground - scale), pants)
        _rect(draw, (right_x - scale, body_bottom, right_x, ground - scale), outline)
        _rect(draw, (right_x, body_bottom, right_x + scale, ground - scale), pants_shadow)
        _rect(draw, (left_x - scale, ground - scale, left_x + scale, ground), shoes)
        _rect(draw, (right_x - scale, ground - scale, right_x + scale, ground), shoes)

        # Arms.
        arm_y0 = torso_top + scale
        arm_y1 = body_bottom - scale
        lx = cx - (torso_half + 2) * scale + arm_shift
        rx = cx + (torso_half + 1) * scale - arm_shift
        _rect(draw, (lx, arm_y0, lx + scale, arm_y1), outline)
        _rect(draw, (lx + 1, arm_y0 + scale, lx + scale, arm_y1 - scale), shirt_shadow)
        _rect(draw, (rx, arm_y0, rx + scale, arm_y1), outline)
        _rect(draw, (rx, arm_y0 + scale, rx + scale - 1, arm_y1 - scale), shirt)
        _rect(draw, (lx, arm_y1, lx + scale, arm_y1 + scale), skin)
        _rect(draw, (rx, arm_y1, rx + scale, arm_y1 + scale), skin)

        # Torso.
        _rect(draw, (cx - (torso_half + 1) * scale, torso_top - scale,
                     cx + (torso_half + 1) * scale, body_bottom), outline)
        _rect(draw, (cx - torso_half * scale, torso_top,
                     cx + torso_half * scale, body_bottom - scale), shirt)
        if direction == "south":
            _rect(draw, (cx - torso_half * scale, body_bottom - 2 * scale,
                         cx + torso_half * scale, body_bottom - scale), shirt_shadow)
        else:
            _rect(draw, (cx + scale, torso_top,
                         cx + torso_half * scale, body_bottom - scale), shirt_shadow)

        # Head and hair.
        _rect(draw, (cx - (head_half + 1) * scale, head_top - scale,
                     cx + (head_half + 1) * scale, torso_top), outline)
        _rect(draw, (cx - head_half * scale, head_top,
                     cx + head_half * scale, torso_top - scale), skin)
        _rect(draw, (cx - head_half * scale, head_top,
                     cx + head_half * scale, head_top + 2 * scale), hair)
        if direction == "south":
            eye_y = head_top + 3 * scale
            _rect(draw, (cx - 2 * scale, eye_y, cx - scale, eye_y + scale - 1), outline)
            _rect(draw, (cx + scale, eye_y, cx + 2 * scale, eye_y + scale - 1), outline)
        else:
            _rect(draw, (cx - head_half * scale, head_top,
                         cx + head_half * scale, head_top + 4 * scale), hair)
    else:
        facing = 1 if direction == "east" else -1
        head_w = 5 * scale
        torso_w = 5 * scale
        front = cx + facing * scale
        # Back/front legs separate horizontally during gait.
        back_x = cx - facing * scale + leg_shift
        front_x = cx + facing * scale - leg_shift
        for x, fill in ((back_x, pants_shadow), (front_x, pants)):
            _rect(draw, (x - scale, body_bottom, x, ground - scale), outline)
            _rect(draw, (x, body_bottom, x + scale, ground - scale), fill)
            _rect(draw, (x - scale, ground - scale, x + scale, ground), shoes)

        # Rear arm then body then front arm to make direction readable.
        rear_x = cx - facing * (3 * scale) + arm_shift
        _rect(draw, (rear_x - scale, torso_top + scale, rear_x + scale, body_bottom), outline)
        _rect(draw, (rear_x, torso_top + 2 * scale, rear_x + scale, body_bottom - scale), shirt_shadow)

        x0 = cx - torso_w // 2
        x1 = x0 + torso_w
        _rect(draw, (x0 - scale, torso_top - scale, x1 + scale, body_bottom), outline)
        _rect(draw, (x0, torso_top, x1, body_bottom - scale), shirt)
        shadow_x0 = x0 if facing < 0 else x1 - 2 * scale
        _rect(draw, (shadow_x0, torso_top, shadow_x0 + 2 * scale, body_bottom - scale), shirt_shadow)

        front_arm_x = cx + facing * (3 * scale) - arm_shift
        _rect(draw, (front_arm_x - scale, torso_top + scale, front_arm_x + scale, body_bottom), outline)
        _rect(draw, (front_arm_x, torso_top + 2 * scale, front_arm_x + scale, body_bottom - scale), shirt)
        _rect(draw, (front_arm_x - scale, body_bottom - scale, front_arm_x + scale, body_bottom), skin)

        hx0 = cx - head_w // 2
        hx1 = hx0 + head_w
        _rect(draw, (hx0 - scale, head_top - scale, hx1 + scale, torso_top), outline)
        _rect(draw, (hx0, head_top, hx1, torso_top - scale), skin)
        hair_x0 = hx0 if facing > 0 else hx0 + 2 * scale
        _rect(draw, (hair_x0, head_top, hair_x0 + 3 * scale, head_top + 3 * scale), hair)
        eye_x = front + facing * scale
        eye_x2 = eye_x + facing * scale
        _rect(draw, (min(eye_x, eye_x2), head_top + 3 * scale,
                     max(eye_x, eye_x2), head_top + 4 * scale - 1), outline)

    return image


def render_pixel_character(recipe_path: Path, output_dir: Path) -> dict[str, Any]:
    recipe_path = recipe_path.resolve()
    recipe = _load_recipe(recipe_path)
    character_id = _safe_id(recipe.get("id"))
    size_raw = recipe.get("canvas", [32, 48])
    if not isinstance(size_raw, list) or len(size_raw) != 2:
        raise ValueError("canvas must be [width, height]")
    size = (int(size_raw[0]), int(size_raw[1]))
    anchor_raw = recipe.get("anchor", [size[0] // 2, size[1] - 2])
    if not isinstance(anchor_raw, list) or len(anchor_raw) != 2:
        raise ValueError("anchor must be [x, y]")
    anchor = [int(anchor_raw[0]), int(anchor_raw[1])]
    if not (0 <= anchor[0] <= size[0] and 0 <= anchor[1] <= size[1]):
        raise ValueError("anchor lies outside canvas")

    colors = _palette(recipe)
    frame_duration = int(recipe.get("walkFrameDurationMs", 140))
    if not (40 <= frame_duration <= 1000):
        raise ValueError("walkFrameDurationMs must be between 40 and 1000")

    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    animation_dir = output_dir / "animations"
    animation_dir.mkdir(exist_ok=True)

    frame_records: dict[str, dict[str, str]] = {}
    packages: dict[str, Any] = {}
    poses = ("idle", "walk_0", "walk_1", "walk_2", "walk_3")

    for direction in DIRECTIONS:
        frame_records[direction] = {}
        walk_frames = []
        for pose in poses:
            image = _pixel_character(size, direction, pose, colors)
            name = f"{character_id}_{direction}_{pose}.png"
            destination = frames_dir / name
            image.save(destination, format="PNG", optimize=False)
            frame_records[direction][pose] = str(destination)
            if pose.startswith("walk_"):
                walk_frames.append({
                    "id": pose,
                    "path": str(Path("..") / "frames" / name),
                    "durationMs": frame_duration,
                })

        animation_recipe = {
            "contract": ANIMATION_CONTRACT,
            "id": f"{character_id}_{direction}_walk",
            "pixelArt": True,
            "loop": True,
            "frameDurationMs": frame_duration,
            "anchor": anchor,
            "frames": walk_frames,
        }
        recipe_out = animation_dir / f"{character_id}_{direction}_walk.recipe.json"
        recipe_out.write_text(json.dumps(animation_recipe, indent=2) + "\n", encoding="utf-8")
        packages[direction] = package_animation(recipe_out, animation_dir / direction)

    # Native-scale board: rows are directions; columns are idle + four walk frames.
    board = Image.new("RGBA", (size[0] * len(poses), size[1] * len(DIRECTIONS)), (0, 0, 0, 0))
    for row, direction in enumerate(DIRECTIONS):
        for col, pose in enumerate(poses):
            with Image.open(frame_records[direction][pose]) as frame:
                board.alpha_composite(frame.convert("RGBA"), (col * size[0], row * size[1]))
    board_path = output_dir / f"{character_id}_pixel_review.png"
    board.save(board_path, format="PNG", optimize=False)

    manifest = {
        "contract": PIXEL_CHARACTER_CONTRACT,
        "id": character_id,
        "pixelArt": True,
        "canvas": list(size),
        "anchor": anchor,
        "directions": list(DIRECTIONS),
        "poses": list(poses),
        "palette": {key: recipe.get("palette", {}).get(key, value) for key, value in DEFAULT_PALETTE.items()},
        "frames": frame_records,
        "walkAnimations": {direction: package["manifest"] for direction, package in packages.items()},
        "review": str(board_path),
        "recipeSha256": hashlib.sha256(recipe_path.read_bytes()).hexdigest(),
        "artApproved": False,
        "runtimePromotion": False,
    }
    manifest_path = output_dir / f"{character_id}.pixel_character.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return {
        "status": "ok",
        "contract": PIXEL_CHARACTER_CONTRACT,
        "id": character_id,
        "canvas": list(size),
        "directions": len(DIRECTIONS),
        "frames": len(DIRECTIONS) * len(poses),
        "review": str(board_path),
        "manifest": str(manifest_path),
        "animationManifests": {key: value["manifest"] for key, value in packages.items()},
        "artApproved": False,
        "runtimePromotion": False,
    }
