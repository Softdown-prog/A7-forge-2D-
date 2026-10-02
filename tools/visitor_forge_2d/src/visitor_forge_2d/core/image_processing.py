"""A7 Image Processing Engine V1.

Deterministic finishing operators for authored RGBA assets. The first operators
focus on the failure modes exposed by organic assets: pinholes, noisy alpha,
flat broad values and weak local detail.
"""
from __future__ import annotations

import random
from typing import Sequence

from PIL import Image, ImageEnhance, ImageFilter

IMAGE_PROCESSING_CONTRACT = "A7_IMAGE_PROCESSING_V1"


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, float(value)))


def _rgb(value: str | Sequence[int]) -> tuple[int, int, int]:
    if isinstance(value, str):
        text = value.lstrip("#")
        if len(text) != 6:
            raise ValueError("processing fill colors must use #RRGGBB")
        return tuple(int(text[index:index + 2], 16) for index in (0, 2, 4))  # type: ignore[return-value]
    if len(value) < 3:
        raise ValueError("processing fill colors require RGB channels")
    return tuple(int(_clamp(channel, 0, 255)) for channel in value[:3])  # type: ignore[return-value]


def _smooth_noise(size: tuple[int, int], seed: int, cell_px: int) -> Image.Image:
    width, height = size
    cell = max(3, int(cell_px))
    grid_w = max(2, width // cell + 2)
    grid_h = max(2, height // cell + 2)
    rng = random.Random(int(seed))
    small = Image.new("L", (grid_w, grid_h), 128)
    pixels = small.load()
    for y in range(grid_h):
        for x in range(grid_w):
            pixels[x, y] = rng.randrange(0, 256)
    return small.resize((width, height), Image.Resampling.BICUBIC)


def alpha_cleanup(
    image: Image.Image,
    *,
    close_px: int = 1,
    open_px: int = 0,
    feather_radius: float = 0.35,
    fill_color: str | Sequence[int] | None = None,
    fill_strength: float = 0.75,
) -> Image.Image:
    """Repair small alpha holes without blurring the entire artwork.

    Newly-created alpha receives an optional authored fill color underneath the
    original RGB. This avoids transparent-black fringes when morphology expands
    coverage into previously empty pixels.
    """
    if image.mode != "RGBA":
        raise ValueError("alpha cleanup requires RGBA input")
    out = image.copy()
    original_alpha = out.getchannel("A")
    alpha = original_alpha

    close = max(0, int(close_px))
    if close:
        kernel = close * 2 + 1
        alpha = alpha.filter(ImageFilter.MaxFilter(kernel)).filter(ImageFilter.MinFilter(kernel))
    opening = max(0, int(open_px))
    if opening:
        kernel = opening * 2 + 1
        alpha = alpha.filter(ImageFilter.MinFilter(kernel)).filter(ImageFilter.MaxFilter(kernel))
    if feather_radius > 0.0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(float(feather_radius)))

    if fill_color is not None:
        color = _rgb(fill_color)
        strength = _clamp(fill_strength, 0.0, 1.0)
        grown = Image.new("L", image.size, 0)
        grown_px = grown.load()
        alpha_px = alpha.load()
        original_px = original_alpha.load()
        for y in range(image.height):
            for x in range(image.width):
                grown_px[x, y] = max(0, alpha_px[x, y] - original_px[x, y])
        if strength < 1.0:
            grown = grown.point(lambda px: round(px * strength))
        under = Image.new("RGBA", image.size, (*color, 0))
        under.putalpha(grown)
        under.alpha_composite(out)
        out = under

    out.putalpha(alpha)
    return out


def depth_lighting(
    image: Image.Image,
    depth_field: Image.Image,
    *,
    strength: float = 0.18,
    bias: float = 0.0,
    preserve_alpha: bool = True,
) -> Image.Image:
    """Apply broad value modulation from a scalar depth field."""
    if image.mode != "RGBA":
        raise ValueError("depth lighting requires RGBA input")
    depth = depth_field if depth_field.mode == "L" else depth_field.convert("L")
    if depth.size != image.size:
        raise ValueError("depth field must match image size")
    strength = _clamp(strength, 0.0, 1.0)
    bias = _clamp(bias, -0.5, 0.5)
    out = Image.new("RGBA", image.size, (0, 0, 0, 0))
    src = image.load()
    dep = depth.load()
    dst = out.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = src[x, y]
            d = dep[x, y] / 255.0
            multiplier = 1.0 + ((d - 0.5) + bias) * strength
            dst[x, y] = (
                round(_clamp(r * multiplier, 0, 255)),
                round(_clamp(g * multiplier, 0, 255)),
                round(_clamp(b * multiplier, 0, 255)),
                a if preserve_alpha else round(_clamp(a * multiplier, 0, 255)),
            )
    return out


def masked_material_variation(
    image: Image.Image,
    mask: Image.Image,
    *,
    seed: int = 1,
    coarse_px: int = 11,
    coarse_amount: float = 0.13,
    fine_amount: float = 0.035,
    vertical_light: float = 0.05,
) -> Image.Image:
    """Apply deterministic material variation inside an authored mask.

    This is deliberately generic: bark, wall plaster, stone, roof tiles or metal
    may all receive restrained broad/fine value variation without changing the
    source geometry or alpha.
    """
    if image.mode != "RGBA":
        raise ValueError("masked material variation requires RGBA input")
    material_mask = mask if mask.mode == "L" else mask.convert("L")
    if material_mask.size != image.size:
        raise ValueError("material mask must match image size")
    coarse_amount = _clamp(coarse_amount, 0.0, 0.5)
    fine_amount = _clamp(fine_amount, 0.0, 0.2)
    vertical_light = _clamp(vertical_light, -0.3, 0.3)
    coarse = _smooth_noise(image.size, int(seed), int(coarse_px))
    rng = random.Random(int(seed) + 104729)
    out = image.copy()
    src = image.load()
    dst = out.load()
    mask_px = material_mask.load()
    coarse_px_data = coarse.load()
    height = max(1, image.height - 1)
    for y in range(image.height):
        y_norm = y / height
        for x in range(image.width):
            weight = mask_px[x, y] / 255.0
            if weight <= 0.0:
                continue
            r, g, b, a = src[x, y]
            coarse_n = coarse_px_data[x, y] / 255.0 - 0.5
            fine_n = rng.random() - 0.5
            value_delta = coarse_n * coarse_amount + fine_n * fine_amount + (0.5 - y_norm) * vertical_light
            multiplier = 1.0 + value_delta * weight
            dst[x, y] = (
                round(_clamp(r * multiplier, 0, 255)),
                round(_clamp(g * multiplier, 0, 255)),
                round(_clamp(b * multiplier, 0, 255)),
                a,
            )
    return out


def local_contrast(
    image: Image.Image,
    *,
    radius: float = 1.4,
    amount: float = 0.55,
    global_contrast: float = 1.0,
) -> Image.Image:
    """Enhance medium/small detail while keeping alpha untouched."""
    if image.mode != "RGBA":
        raise ValueError("local contrast requires RGBA input")
    alpha = image.getchannel("A")
    rgb = image.convert("RGB")
    amount = max(0.0, float(amount))
    if amount > 0.0:
        # Unsharp mask is used as a deterministic local-contrast operator; radius
        # and percent are deliberately modest so it does not invent hard halos.
        rgb = rgb.filter(ImageFilter.UnsharpMask(
            radius=max(0.1, float(radius)),
            percent=round(min(300.0, amount * 100.0)),
            threshold=2,
        ))
    if abs(float(global_contrast) - 1.0) > 1e-6:
        rgb = ImageEnhance.Contrast(rgb).enhance(float(global_contrast))
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out
