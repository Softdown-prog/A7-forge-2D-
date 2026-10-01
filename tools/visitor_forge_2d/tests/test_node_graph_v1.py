import json
import math
from pathlib import Path

from PIL import Image

from visitor_forge_2d.core.brush_engine_v2 import BRUSH_CONTRACT, BrushEngineV2
from visitor_forge_2d.core.distribution_engine import DISTRIBUTION_CONTRACT, DistributionEngineV1
from visitor_forge_2d.core.geometry_engine import GEOMETRY_CONTRACT, draw_tapered_paths
from visitor_forge_2d.core.node_graph import GRAPH_CONTRACT, execute, validate_recipe


def _recipe() -> dict:
    path = Path(__file__).resolve().parents[1] / "examples" / "park_tree_brush_graph_pilot_01.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _structural_recipe() -> dict:
    return {
        "contract": GRAPH_CONTRACT,
        "id": "draw_engine_structural_test",
        "canvas": [96, 96],
        "anchor": [48, 94],
        "seed": 20261001,
        "camera": {
            "contract": "CH_CAMERA_V1",
            "projection": "orthographic_dimetric",
            "tile": [128, 64],
            "yawDeg": 45,
            "elevationDeg": 30,
            "worldHeightScreenVertical": True,
        },
        "graph": {
            "seed": 20261001,
            "nodes": [
                {"id": "base", "type": "canvas", "params": {"color": [0, 0, 0, 0]}},
                {
                    "id": "branch",
                    "type": "tapered_path",
                    "inputs": {"image": "base"},
                    "params": {
                        "supersample": 4,
                        "paths": [
                            {
                                "points": [[48, 91], [48, 72], [46, 55], [40, 39]],
                                "widthStart": 12,
                                "widthEnd": 3,
                                "fill": "#81552F",
                                "outline": "#4E301D",
                                "outlineWidth": 1,
                            }
                        ],
                    },
                },
                {
                    "id": "leaves",
                    "type": "spaced_scatter",
                    "inputs": {"image": "branch"},
                    "params": {
                        "brushes": ["foliage/leaf_oval_01.png", "foliage/leaf_oval_02.png"],
                        "regions": [
                            {"center": [39, 36], "radius": [25, 18], "weight": 1.0},
                            {"center": [57, 43], "radius": [22, 17], "weight": 0.8},
                        ],
                        "count": 24,
                        "minDistance": 7,
                        "scale": [0.45, 0.7],
                        "rotationDeg": [-160, 160],
                        "opacity": [235, 255],
                        "tints": ["#3F7546", "#568E50", "#6AA05A"],
                    },
                },
                {"id": "output", "type": "output", "inputs": {"image": "leaves"}},
            ],
        },
    }


def test_brush_engine_v2_scatter_is_deterministic() -> None:
    first = Image.new("RGBA", (96, 96))
    second = Image.new("RGBA", (96, 96))
    params = dict(
        brushes=["foliage/leaf_oval_01.png", "foliage/leaf_oval_02.png"],
        regions=[{"center": [48, 48], "radius": [34, 28]}],
        count=120,
        scale=[.35, .65],
        rotation_deg=[-180, 180],
        opacity=[235, 255],
        tints=["#4E824F", "#82B96B"],
    )
    a = BrushEngineV2(44)
    b = BrushEngineV2(44)
    a.scatter_regions(first, **params)
    b.scatter_regions(second, **params)
    assert a.contract == BRUSH_CONTRACT
    assert first.tobytes() == second.tobytes()
    assert first.getchannel("A").getbbox() is not None


def test_node_graph_pilot_uses_bitmap_brushes_and_is_deterministic() -> None:
    recipe = _recipe()
    assert recipe["contract"] == GRAPH_CONTRACT
    validate_recipe(recipe)
    first, meta = execute(recipe)
    second, repeated = execute(recipe)
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


def test_tapered_path_is_continuous_and_antialiased() -> None:
    image = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    stats = draw_tapered_paths(
        image,
        [{
            "points": [[48, 88], [48, 64], [48, 42], [48, 20]],
            "widthStart": 12,
            "widthEnd": 4,
            "fill": "#805432",
            "outline": "#4A2E1D",
            "outlineWidth": 1,
        }],
        supersample=4,
    )
    assert stats["contract"] == GEOMETRY_CONTRACT
    assert stats["pathCount"] == 1
    for y in range(21, 89):
        assert image.getpixel((48, y))[3] > 0
    assert image.getchannel("A").getbbox() is not None


def test_distribution_engine_respects_minimum_distance_and_is_deterministic() -> None:
    regions = [{"center": [48, 48], "radius": [35, 28], "weight": 1.0}]
    first_engine = DistributionEngineV1(77)
    second_engine = DistributionEngineV1(77)
    first, attempts = first_engine.sample_spaced(regions, 30, min_distance=7)
    second, repeated_attempts = second_engine.sample_spaced(regions, 30, min_distance=7)
    assert first_engine.contract == DISTRIBUTION_CONTRACT
    assert first == second
    assert attempts == repeated_attempts
    assert len(first) == 30
    for index, a in enumerate(first):
        for b in first[index + 1:]:
            assert math.hypot(a[0] - b[0], a[1] - b[1]) >= 7 - 1e-9


def test_node_graph_structural_nodes_are_deterministic() -> None:
    recipe = _structural_recipe()
    validate_recipe(recipe)
    first, meta = execute(recipe)
    second, repeated = execute(recipe)
    assert first.tobytes() == second.tobytes()
    assert meta["pixelSha256"] == repeated["pixelSha256"]
    assert meta["geometryContract"] == GEOMETRY_CONTRACT
    assert meta["distributionContract"] == DISTRIBUTION_CONTRACT
    assert meta["critic"]["continuousGeometry"] is True
    assert meta["critic"]["minimumDistanceDistribution"] is True
    assert meta["nodes"]["branch"]["pathCount"] == 1
    assert meta["nodes"]["leaves"]["minDistance"] == 7.0
    assert 12 <= meta["nodes"]["leaves"]["stampCount"] <= 24


def test_node_graph_rejects_forward_references() -> None:
    recipe = _recipe()
    recipe["graph"]["nodes"][0]["inputs"] = {"image": "future"}
    try:
        validate_recipe(recipe)
    except ValueError as error:
        assert "unavailable node" in str(error)
    else:
        raise AssertionError("forward reference should fail validation")
