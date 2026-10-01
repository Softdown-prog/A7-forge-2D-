import json
from pathlib import Path
from PIL import Image
from visitor_forge_2d.core.brush_engine_v2 import BRUSH_CONTRACT, BrushEngineV2
from visitor_forge_2d.core.node_graph import GRAPH_CONTRACT, execute, validate_recipe


def _recipe() -> dict:
    path = Path(__file__).resolve().parents[1] / "examples" / "park_tree_brush_graph_pilot_01.json"
    return json.loads(path.read_text(encoding="utf-8"))


def test_brush_engine_v2_scatter_is_deterministic() -> None:
    first = Image.new("RGBA", (96, 96)); second = Image.new("RGBA", (96, 96))
    params = dict(brushes=["foliage/leaf_oval_01.png", "foliage/leaf_oval_02.png"], regions=[{"center": [48, 48], "radius": [34, 28]}], count=120, scale=[.35, .65], rotation_deg=[-180, 180], opacity=[235, 255], tints=["#4E824F", "#82B96B"])
    a = BrushEngineV2(44); b = BrushEngineV2(44)
    a.scatter_regions(first, **params); b.scatter_regions(second, **params)
    assert a.contract == BRUSH_CONTRACT
    assert first.tobytes() == second.tobytes()
    assert first.getchannel("A").getbbox() is not None


def test_node_graph_pilot_uses_bitmap_brushes_and_is_deterministic() -> None:
    recipe = _recipe(); assert recipe["contract"] == GRAPH_CONTRACT; validate_recipe(recipe)
    first, meta = execute(recipe); second, repeated = execute(recipe)
    assert first.mode == "RGBA" and list(first.size) == recipe["canvas"]
    assert first.tobytes() == second.tobytes()
    assert meta["pixelSha256"] == repeated["pixelSha256"]
    assert meta["critic"]["nodeGraph"] is True
    assert meta["critic"]["bitmapBrushTips"] is True
    assert meta["critic"]["assetSpecificRenderer"] is False
    assert meta["brushContract"] == BRUSH_CONTRACT
    assert meta["nodeCount"] == 7
    assert meta["nodes"]["rear"]["stampCount"] == 500
    assert meta["nodes"]["mid"]["stampCount"] == 620
    assert meta["nodes"]["front"]["stampCount"] == 360


def test_node_graph_rejects_forward_references() -> None:
    recipe = _recipe(); recipe["graph"]["nodes"][0]["inputs"] = {"image": "future"}
    try:
        validate_recipe(recipe)
    except ValueError as error:
        assert "unavailable node" in str(error)
    else:
        raise AssertionError("forward reference should fail validation")
