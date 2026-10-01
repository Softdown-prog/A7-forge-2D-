import hashlib
import json
from pathlib import Path

from PIL import Image

from visitor_forge_2d.core.structured_broadleaf_scenery import render
from visitor_forge_2d.workers import run_workers, validate_recipe


def _recipe_path() -> Path:
    return Path(__file__).resolve().parents[1] / "examples" / "park_tree_green_canopy_01.json"


def test_structured_broadleaf_is_deterministic_and_not_single_blob() -> None:
    recipe = json.loads(_recipe_path().read_text(encoding="utf-8"))
    assert validate_recipe(recipe) == "structured_broadleaf"

    first, metadata = render(recipe, "south")
    second, repeated = render(recipe, "south")

    assert first.tobytes() == second.tobytes()
    assert metadata["bounds"] == repeated["bounds"]
    assert metadata["authoringMode"] == "branch_guided_macro_subgroups_v1"
    assert metadata["critic"]["singleCanopyBlob"] is False
    assert metadata["critic"]["randomFinalGrain"] is False
    assert metadata["critic"]["branchDerivedMassCount"] >= 6
    assert metadata["critic"]["macroMassCount"] >= 10
    assert metadata["critic"]["explicitLeafCount"] >= 100


def test_structured_broadleaf_four_views_are_distinct_and_rgba() -> None:
    recipe = json.loads(_recipe_path().read_text(encoding="utf-8"))
    hashes = set()
    for view in ("south", "west", "north", "east"):
        frame, metadata = render(recipe, view)
        assert frame.mode == "RGBA"
        assert list(frame.size) == recipe["canvas"]
        assert frame.getchannel("A").getbbox() == tuple(metadata["bounds"])
        hashes.add(hashlib.sha256(frame.tobytes()).hexdigest())
    assert len(hashes) == 4


def test_structured_broadleaf_worker_exports_review_and_critic(tmp_path: Path) -> None:
    result = run_workers(_recipe_path(), tmp_path)
    assert result["kind"] == "structured_broadleaf"
    assert result["status"] == "review_ready"
    assert result["audit"]["critic"]["singleCanopyBlob"] is False
    assert result["audit"]["critic"]["randomFinalGrain"] is False

    with Image.open(result["png"]) as image:
        assert image.mode == "RGBA"
        assert list(image.size) == [256, 320]
    with Image.open(result["isometricReview"]) as review:
        assert review.size == (768, 480)
