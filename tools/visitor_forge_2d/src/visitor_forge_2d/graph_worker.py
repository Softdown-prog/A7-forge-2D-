"""Dedicated production worker for A7 Node Graph V1 recipes."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from PIL import Image
from .core import graph_scenery, node_graph


def run_graph_workers(recipe_path: Path, output_root: Path) -> dict:
    raw = recipe_path.read_bytes(); recipe = json.loads(raw)
    node_graph.validate_recipe(recipe)
    folder = output_root / recipe["id"]
    result = graph_scenery.export(recipe_path, folder)
    with Image.open(result["png"]) as image:
        image.load()
        if image.mode != "RGBA" or list(image.size) != recipe["canvas"]:
            raise ValueError("graph export must be RGBA at authored canvas size")
        bounds = image.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("graph export cannot be fully transparent")
    metadata = json.loads(Path(result["metadata"]).read_text(encoding="utf-8"))
    if metadata.get("anchor") != recipe["anchor"]:
        raise ValueError("graph metadata anchor mismatch")
    if metadata.get("camera", {}).get("contract") != "CH_CAMERA_V1":
        raise ValueError("graph export lost CH_CAMERA_V1")
    if metadata.get("critic", {}).get("bitmapBrushTips") is not True:
        raise ValueError("graph export did not use Brush Engine V2 bitmap tips")
    report = {
        "status": "review_ready", "id": recipe["id"], "kind": "node_graph_v1",
        "workers": ["recipe", "node_graph", "brush_engine_v2", "alpha_anchor", "camera_review", "provenance"],
        "recipe": str(recipe_path), "recipeSha256": hashlib.sha256(raw).hexdigest(),
        "png": result["png"], "review": result["review"], "isometricReview": result["isometricReview"],
        "pngSha256": hashlib.sha256(Path(result["png"]).read_bytes()).hexdigest(),
        "audit": {"bounds": list(bounds), "alpha": "RGBA", "critic": metadata.get("critic"), "nodeCount": metadata.get("nodeCount"), "brushContract": metadata.get("brushContract")},
        "artApproved": False, "runtimePromotion": False,
    }
    report_path = folder / "worker_report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return {**report, "report": str(report_path)}
