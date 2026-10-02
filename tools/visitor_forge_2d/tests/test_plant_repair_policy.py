from visitor_forge_2d.core.plant_repair_policy import apply_repair_plan, propose_repair


def _recipe() -> dict:
    return {
        "contract": "CH_2D_GRAPH_RECIPE_V2",
        "id": "internal_bridge_fixture",
        "canvas": [128, 144],
        "anchor": [64, 138],
        "seed": 73191,
        "planner": {
            "branchIds": ["trunk", "p00", "p01"],
            "terminalCount": 6,
        },
        "graph": {
            "seed": 73191,
            "nodes": [
                {
                    "id": "crown_density",
                    "type": "field_radial_density",
                    "params": {
                        "power": 0.74,
                        "lobes": [
                            {"center": [28, 38], "radius": [30, 23], "weight": 0.90},
                            {"center": [61, 31], "radius": [31, 23], "weight": 0.92},
                            {"center": [98, 41], "radius": [30, 22], "weight": 0.88},
                            {"center": [34, 70], "radius": [30, 23], "weight": 0.91},
                            {"center": [68, 68], "radius": [31, 24], "weight": 0.94},
                            {"center": [101, 73], "radius": [30, 23], "weight": 0.89},
                            {"center": [65, 56], "radius": [62, 44], "weight": 0.76},
                        ],
                    },
                },
                {
                    "id": "flower_density",
                    "type": "field_radial_density",
                    "params": {"lobes": [{"center": [61, 31], "radius": [13, 9], "weight": 1.0}]},
                },
                {"id": "rear_foliage", "type": "field_cluster_scatter", "params": {"count": 10, "scale": [0.8, 1.0], "minDistance": 14, "bounds": [10, 10, 118, 112]}},
                {"id": "front_foliage", "type": "field_cluster_scatter", "params": {"count": 16, "scale": [0.7, 1.0], "minDistance": 10.5, "bounds": [10, 10, 118, 112]}},
                {"id": "detail_foliage", "type": "field_mapped_scatter", "params": {"count": 14, "scale": [0.4, 0.6], "minDistance": 5, "bounds": [10, 10, 118, 112]}},
                {"id": "flower_clusters", "type": "field_flower_clusters", "params": {"count": 10, "radiusX": [9, 12], "radiusY": [7, 9], "minDistance": 8, "bounds": [10, 10, 118, 112]}},
            ],
        },
    }


def _hidden_single_view_failure() -> dict:
    # Mirrors the current Ipê failure mode: three strong views hide one broken
    # crown in the mean, while fill, clipping and isolated-mass gates are healthy.
    return {
        "score": 92.31,
        "passed": False,
        "meanContinuity": 0.8707,
        "meanCrownFill": 0.7194,
        "maxIsolatedMasses": 3,
        "meanCrownWoodExposure": 0.6330,
        "maxSilhouetteImbalance": 0.1029,
        "minClippingMarginPx": 4,
    }


def test_policy_repairs_hidden_single_view_fragmentation_without_growing_silhouette() -> None:
    plan = propose_repair(_hidden_single_view_failure())

    assert plan["changed"] is True
    assert plan["bridgeCrownLobes"] is True
    assert plan["projectionScale"] == 1.0
    assert plan["crownRadiusScale"] == 1.0
    assert plan["brushScale"] <= 1.0
    assert plan["flowerCountScale"] == 1.0
    assert plan["frontCountScale"] > 1.0
    assert plan["minDistanceScale"] < 1.0
    assert "close_internal_crown_gaps" in plan["reasons"]


def test_internal_bridge_repair_preserves_identity_and_original_terminal_centers() -> None:
    recipe = _recipe()
    plan = propose_repair(_hidden_single_view_failure())
    repaired = apply_repair_plan(recipe, plan)

    assert repaired["seed"] == recipe["seed"]
    assert repaired["planner"]["branchIds"] == recipe["planner"]["branchIds"]

    original_crown = next(node for node in recipe["graph"]["nodes"] if node["id"] == "crown_density")
    repaired_crown = next(node for node in repaired["graph"]["nodes"] if node["id"] == "crown_density")
    original_lobes = original_crown["params"]["lobes"]
    repaired_lobes = repaired_crown["params"]["lobes"]

    assert [lobe["center"] for lobe in repaired_lobes[:6]] == [lobe["center"] for lobe in original_lobes[:6]]
    assert len(repaired_lobes) > len(original_lobes)
    bridges = [lobe for lobe in repaired_lobes if lobe.get("repairBridge")]
    assert 1 <= len(bridges) <= 6
    assert repaired["planner"]["repair"]["crownBridgeCount"] == len(bridges)

    original_front = next(node for node in recipe["graph"]["nodes"] if node["id"] == "front_foliage")
    repaired_front = next(node for node in repaired["graph"]["nodes"] if node["id"] == "front_foliage")
    assert repaired_front["params"]["count"] > original_front["params"]["count"]
    assert repaired_front["params"]["minDistance"] < original_front["params"]["minDistance"]

    original_flowers = next(node for node in recipe["graph"]["nodes"] if node["id"] == "flower_clusters")
    repaired_flowers = next(node for node in repaired["graph"]["nodes"] if node["id"] == "flower_clusters")
    assert repaired_flowers["params"]["count"] == original_flowers["params"]["count"]
