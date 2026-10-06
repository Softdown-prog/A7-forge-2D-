from pathlib import Path
import json

from PIL import Image

from visitor_forge_2d.pixel_character import (
    PIXEL_CHARACTER_CONTRACT,
    render_pixel_character,
)


def test_pixel_character_generates_four_direction_walks(tmp_path: Path) -> None:
    recipe = {
        "contract": PIXEL_CHARACTER_CONTRACT,
        "id": "pilot",
        "canvas": [32, 48],
        "anchor": [16, 46],
        "walkFrameDurationMs": 120,
        "palette": {"shirt": "#4f82c0"},
    }
    recipe_path = tmp_path / "pilot.json"
    recipe_path.write_text(json.dumps(recipe), encoding="utf-8")

    result = render_pixel_character(recipe_path, tmp_path / "out")

    assert result["directions"] == 4
    assert result["frames"] == 20
    manifest = json.loads(Path(result["manifest"]).read_text(encoding="utf-8"))
    assert manifest["pixelArt"] is True
    assert manifest["anchor"] == [16, 46]
    assert set(manifest["directions"]) == {"south", "east", "north", "west"}

    with Image.open(manifest["frames"]["south"]["idle"]) as frame:
        assert frame.mode == "RGBA"
        assert frame.size == (32, 48)
        assert frame.getchannel("A").getbbox() is not None

    south_animation = json.loads(Path(result["animationManifests"]["south"]).read_text(encoding="utf-8"))
    assert south_animation["frameCount"] == 4
    assert south_animation["pixelArt"] is True
    assert south_animation["sheet"]["resampling"] == "none"


def test_pixel_character_is_deterministic(tmp_path: Path) -> None:
    recipe_path = tmp_path / "pilot.json"
    recipe_path.write_text(json.dumps({
        "contract": PIXEL_CHARACTER_CONTRACT,
        "id": "stable",
        "canvas": [32, 48],
    }), encoding="utf-8")

    first = render_pixel_character(recipe_path, tmp_path / "first")
    second = render_pixel_character(recipe_path, tmp_path / "second")

    a = Path(json.loads(Path(first["manifest"]).read_text())["frames"]["east"]["walk_2"])
    b = Path(json.loads(Path(second["manifest"]).read_text())["frames"]["east"]["walk_2"])
    assert a.read_bytes() == b.read_bytes()
\n
def test_pixel_wizard_archetype_is_class_readable(tmp_path: Path) -> None:
    recipe = {
        "contract": PIXEL_CHARACTER_CONTRACT,
        "id": "wizard",
        "archetype": "wizard",
        "canvas": [32, 48],
        "anchor": [16, 46],
        "palette": {
            "robe": "#6750A4",
            "hat": "#4B4597",
            "hatBand": "#D1A93A",
            "staff": "#79502F",
            "crystal": "#77D9FF"
        },
    }
    recipe_path = tmp_path / "wizard.json"
    recipe_path.write_text(json.dumps(recipe), encoding="utf-8")

    result = render_pixel_character(recipe_path, tmp_path / "wizard_out")
    manifest = json.loads(Path(result["manifest"]).read_text(encoding="utf-8"))

    assert manifest["archetype"] == "wizard"
    assert result["archetype"] == "wizard"
    with Image.open(manifest["frames"]["south"]["idle"]) as frame:
        assert frame.size == (32, 48)
        alpha = frame.getchannel("A")
        bounds = alpha.getbbox()
        assert bounds is not None
        assert bounds[1] >= 0
        assert bounds[2] <= 32
        assert bounds[3] <= 48
        # The staff extends the class silhouette beyond the ordinary torso.
        assert bounds[2] - bounds[0] >= 24
