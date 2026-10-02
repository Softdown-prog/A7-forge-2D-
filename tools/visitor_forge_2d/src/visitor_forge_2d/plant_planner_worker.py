"""Worker that compiles one semantic plant intent into four coherent Graph V2 views."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

from .core import field_graph
from .core.art_planner import ART_PLANNER_CONTRACT, PLANT_INTENT_CONTRACT, plan_plant_four_views
from .core.plant_structure import CARDINAL_VIEWS, PLANT_STRUCTURE_CONTRACT, topology_signature

WORKER_CONTRACT = "A7_PLANT_PLANNER_WORKER_V1"


def _sha(image: Image.Image) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def _structure_payload(structure) -> dict:
    return {
        "contract": structure.contract,
        "seed": structure.seed,
        "profile": structure.profile,
        "topology": [
            {
                "id": branch.branch_id,
                "parentId": branch.parent_id,
                "order": branch.order,
                "widthStart": branch.width_start,
                "widthEnd": branch.width_end,
                "terminal": branch.terminal,
                "points": [[point.x, point.y, point.z] for point in branch.points],
            }
            for branch in structure.branches
        ],
    }


def _four_view_board(frames: dict[str, Image.Image]) -> Image.Image:
    first = frames[CARDINAL_VIEWS[0]]
    margin = 18
    label_h = 22
    cell_w = first.width + margin * 2
    cell_h = first.height + margin * 2 + label_h
    board = Image.new("RGBA", (cell_w * 2, cell_h * 2), (20, 23, 25, 255))
    draw = ImageDraw.Draw(board)
    for index, view in enumerate(CARDINAL_VIEWS):
        col = index % 2
        row = index // 2
        ox = col * cell_w + margin
        oy = row * cell_h + margin + label_h
        preview = frames[view]
        board.alpha_composite(preview, (ox, oy))
        draw.text((ox, row * cell_h + margin), view.upper(), fill=(235, 238, 240, 255))
    return board


def run_plant_planner(intent_path: Path, output_root: Path) -> dict:
    raw = intent_path.read_bytes()
    intent = json.loads(raw)
    if intent.get("contract") != PLANT_INTENT_CONTRACT:
        raise ValueError(f"plant intent must declare {PLANT_INTENT_CONTRACT}")

    structure, recipes = plan_plant_four_views(intent)
    output_root.mkdir(parents=True, exist_ok=True)
    structure_path = output_root / "canonical_structure.json"
    structure_path.write_text(json.dumps(_structure_payload(structure), indent=2) + "\n", encoding="utf-8")

    frames: dict[str, Image.Image] = {}
    view_reports: dict[str, dict] = {}
    expected_topology = topology_signature(structure.branches)
    expected_ids = [entry[0] for entry in expected_topology]

    for view in CARDINAL_VIEWS:
        recipe = recipes[view]
        planner = recipe.get("planner", {})
        if planner.get("branchIds") != expected_ids:
            raise ValueError(f"{view} planner lost canonical branch identity")
        recipe_path = output_root / f"{recipe['id']}.json"
        recipe_path.write_text(json.dumps(recipe, indent=2) + "\n", encoding="utf-8")
        frame, metadata = field_graph.execute(recipe)
        bounds = frame.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{view} planner render is fully transparent")
        png_path = output_root / f"{recipe['id']}.png"
        frame.save(png_path)
        frames[view] = frame
        view_reports[view] = {
            "recipe": str(recipe_path),
            "png": str(png_path),
            "pixelSha256": _sha(frame),
            "bounds": list(bounds),
            "nodeCount": metadata.get("nodeCount"),
            "critic": metadata.get("critic", {}),
            "planner": planner,
        }

    if len({report["pixelSha256"] for report in view_reports.values()}) < 3:
        raise ValueError("cardinal projections collapsed into visually identical outputs")

    board = _four_view_board(frames)
    board_path = output_root / "plant_planner_four_views.png"
    board.save(board_path)

    report = {
        "contract": WORKER_CONTRACT,
        "plannerContract": ART_PLANNER_CONTRACT,
        "intentContract": PLANT_INTENT_CONTRACT,
        "structureContract": PLANT_STRUCTURE_CONTRACT,
        "intent": str(intent_path),
        "intentSha256": hashlib.sha256(raw).hexdigest(),
        "structure": str(structure_path),
        "branchCount": len(structure.branches),
        "terminalCount": len(structure.terminal_points),
        "topologySignature": [list(entry) for entry in expected_topology],
        "views": view_reports,
        "board": str(board_path),
        "status": "review_ready",
        "artApproved": False,
        "runtimePromotion": False,
    }
    report_path = output_root / "plant_planner_report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return {**report, "report": str(report_path)}
