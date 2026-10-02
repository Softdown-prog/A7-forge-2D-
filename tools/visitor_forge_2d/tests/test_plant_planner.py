from visitor_forge_2d.core.art_planner import (
    ART_PLANNER_CONTRACT,
    PLANT_INTENT_CONTRACT,
    plan_plant_four_views,
)
from visitor_forge_2d.core.field_graph import FIELD_GRAPH_CONTRACT, validate_recipe
from visitor_forge_2d.core.flower_cluster_engine import FLOWER_CLUSTER_CONTRACT
from visitor_forge_2d.core.plant_structure import (
    CARDINAL_VIEWS,
    PLANT_STRUCTURE_CONTRACT,
    generate_plant_structure,
    project_four_views,
    topology_signature,
)


def _intent() -> dict:
    return {
        "contract": PLANT_INTENT_CONTRACT,
        "id": "planner_test_tree",
        "species": "ipe_amarelo",
        "age": "adult",
        "crown": "wide_irregular",
        "flowering": {"amount": 0.75, "color": "#F2C531"},
        "seed": 99173,
        "canvas": [256, 320],
        "anchor": [128, 310],
    }


def test_structural_plant_engine_is_deterministic() -> None:
    first = generate_plant_structure(12345, {"primaryCount": 5, "secondaryPerPrimary": 2})
    second = generate_plant_structure(12345, {"primaryCount": 5, "secondaryPerPrimary": 2})

    assert PLANT_STRUCTURE_CONTRACT == "A7_PLANT_STRUCTURE_V1"
    assert first == second
    assert topology_signature(first.branches) == topology_signature(second.branches)
    assert len(first.terminal_points) == 10


def test_four_views_share_topology_but_change_projection() -> None:
    structure = generate_plant_structure(77, {"primaryCount": 6, "secondaryPerPrimary": 2})
    views = project_four_views(structure)

    assert tuple(views) == CARDINAL_VIEWS
    branch_ids = views["south"].branch_ids
    assert all(projection.branch_ids == branch_ids for projection in views.values())
    assert views["south"].terminals != views["west"].terminals
    assert views["north"].terminals != views["east"].terminals
    assert all(len(projection.terminals) == len(structure.terminal_points) for projection in views.values())


def test_art_planner_compiles_valid_v2_recipes_for_all_views() -> None:
    structure, recipes = plan_plant_four_views(_intent())

    assert ART_PLANNER_CONTRACT == "A7_ART_PLANNER_V1"
    assert structure.contract == PLANT_STRUCTURE_CONTRACT
    assert set(recipes) == set(CARDINAL_VIEWS)
    expected_branch_ids = [branch.branch_id for branch in structure.branches]

    for view, recipe in recipes.items():
        validate_recipe(recipe)
        assert recipe["contract"] == FIELD_GRAPH_CONTRACT
        assert recipe["planner"]["contract"] == ART_PLANNER_CONTRACT
        assert recipe["planner"]["view"] == view
        assert recipe["planner"]["branchIds"] == expected_branch_ids
        assert recipe["planner"]["terminalCount"] == len(structure.terminal_points)
        assert recipe["planner"]["temporaryFlowerProxy"] is False
        assert recipe["planner"]["flowerPlacement"] == "terminal_density"
        assert recipe["planner"]["flowerEngineContract"] == FLOWER_CLUSTER_CONTRACT
        node_types = {node["type"] for node in recipe["graph"]["nodes"]}
        node_ids = {node["id"] for node in recipe["graph"]["nodes"]}
        assert "field_cluster_scatter" in node_types
        assert "field_flower_clusters" in node_types
        assert "image_masked_relief_material" in node_types
        assert "image_contact_occlusion" in node_types
        assert {"flower_density", "flower_clusters", "flower_composite"} <= node_ids

        scatters = [
            node for node in recipe["graph"]["nodes"]
            if node["type"] in {"field_cluster_scatter", "field_mapped_scatter", "field_flower_clusters"}
        ]
        for node in scatters:
            bounds = node.get("params", {}).get("bounds")
            if bounds is not None:
                assert bounds[0] >= 34
                assert bounds[2] <= recipe["canvas"][0] - 34
                assert bounds[1] >= 30
                assert bounds[3] <= recipe["canvas"][1] - 28


def test_planner_crown_and_flowers_are_derived_from_projected_terminals() -> None:
    structure, recipes = plan_plant_four_views(_intent())
    recipe = recipes["south"]
    crown = next(node for node in recipe["graph"]["nodes"] if node["id"] == "crown_density")
    flowers = next(node for node in recipe["graph"]["nodes"] if node["id"] == "flower_density")
    flower_clusters = next(node for node in recipe["graph"]["nodes"] if node["id"] == "flower_clusters")

    crown_lobes = crown["params"]["lobes"]
    flower_lobes = flowers["params"]["lobes"]
    assert len(crown_lobes) == len(structure.terminal_points) + 1
    assert len(flower_lobes) == len(structure.terminal_points)
    assert all("center" in lobe and "radius" in lobe for lobe in crown_lobes)
    assert all("center" in lobe and "radius" in lobe for lobe in flower_lobes)
    assert flower_clusters["type"] == "field_flower_clusters"
    assert flower_clusters["params"]["palette"]["highlight"] == "#FFE96A"
    assert flower_clusters["params"]["gapWindows"] == [2, 3]
