from visitor_forge_2d.core.art_planner import PLANT_INTENT_CONTRACT, plan_plant_four_views
from visitor_forge_2d.core.branch_geometry_v2 import BRANCH_GEOMETRY_CONTRACT, upgrade_plant_wood_recipe
from visitor_forge_2d.core.plant_structure import CARDINAL_VIEWS, topology_signature


def _intent() -> dict:
    return {
        "contract": PLANT_INTENT_CONTRACT,
        "id": "branch_geometry_test_tree",
        "species": "ipe_amarelo",
        "age": "adult",
        "crown": "wide_irregular",
        "flowering": {"amount": 0.78, "color": "#F2C531"},
        "seed": 99173,
        "canvas": [256, 320],
        "anchor": [128, 310],
    }


def _node(recipe: dict, node_id: str) -> dict:
    return next(node for node in recipe["graph"]["nodes"] if node["id"] == node_id)


def test_branch_geometry_v2_is_deterministic_and_preserves_identity() -> None:
    structure, recipes = plan_plant_four_views(_intent())
    original_signature = topology_signature(structure.branches)
    first = upgrade_plant_wood_recipe(recipes["south"], structure, view="south")
    second = upgrade_plant_wood_recipe(recipes["south"], structure, view="south")

    assert BRANCH_GEOMETRY_CONTRACT == "A7_BRANCH_GEOMETRY_V2"
    assert first == second
    assert topology_signature(structure.branches) == original_signature
    assert first["planner"]["branchGeometryContract"] == BRANCH_GEOMETRY_CONTRACT
    assert first["planner"]["branchGeometryPathCount"] == len(structure.branches)
    assert first["planner"]["branchIds"] == recipes["south"]["planner"]["branchIds"]


def test_branch_geometry_adds_dense_centerlines_taper_and_fused_starts() -> None:
    structure, recipes = plan_plant_four_views(_intent())
    original = recipes["south"]
    upgraded = upgrade_plant_wood_recipe(original, structure, view="south")
    old_paths = _node(original, "wood_structure")["params"]["paths"]
    new_paths = _node(upgraded, "wood_structure")["params"]["paths"]

    assert len(new_paths) == len(structure.branches)
    assert len(new_paths[0]["points"]) >= 9
    assert len(new_paths[1]["points"]) >= 8
    assert len(new_paths[0]["widths"]) == len(new_paths[0]["points"])
    assert "widthStart" not in new_paths[0]
    assert "widthEnd" not in new_paths[0]
    assert new_paths[0]["widths"][0] > new_paths[0]["widths"][-1]
    # A child start is deliberately pulled backwards into its parent junction.
    assert new_paths[1]["points"][0] != old_paths[1]["points"][0]
    assert all(path["branchGeometry"] == BRANCH_GEOMETRY_CONTRACT for path in new_paths)


def test_visible_wood_gets_path_aligned_bark_accents_without_polluting_mask() -> None:
    structure, recipes = plan_plant_four_views(_intent())
    upgraded = upgrade_plant_wood_recipe(recipes["south"], structure, view="south")
    structure_paths = _node(upgraded, "wood_structure")["params"]["paths"]
    visible_paths = _node(upgraded, "wood_visible")["params"]["paths"]
    accents = [path for path in visible_paths if path.get("branchGeometryDetail")]

    assert len(structure_paths) == len(structure.branches)
    assert len(visible_paths) > len(structure_paths)
    assert accents
    assert all("branchGeometryDetail" not in path for path in structure_paths)
    assert all(len(path["points"]) == len(path["widths"]) for path in accents)
    material = _node(upgraded, "wood_material")["params"]
    assert material["grainAmount"] <= 0.085


def test_four_views_share_topology_but_receive_view_specific_organic_projection() -> None:
    structure, recipes = plan_plant_four_views(_intent())
    upgraded = {
        view: upgrade_plant_wood_recipe(recipes[view], structure, view=view)
        for view in CARDINAL_VIEWS
    }
    ids = upgraded["south"]["planner"]["branchIds"]
    assert all(recipe["planner"]["branchIds"] == ids for recipe in upgraded.values())
    south_trunk = _node(upgraded["south"], "wood_structure")["params"]["paths"][0]["points"]
    west_trunk = _node(upgraded["west"], "wood_structure")["params"]["paths"][0]["points"]
    assert south_trunk != west_trunk
