"""IGNITE GeoJSON Demonstration Layers.

Generates standard GeoJSON FeatureCollections for:
- Thermal Hotspots (Point anomalies with FRP & temp metadata)
- Industrial Areas (Polygon footprints for refinery & chemical complexes)
- Forest Regions (Polygon footprints for protected canopy reserves)
- Agricultural Regions (Polygon footprints for crop field plots)
- Infrastructure (LineString & Point networks for pipelines, plants, roads)
- Risk Zones (Polygon buffer zones for thermal impact areas)

NOTE: All coordinates are simulated demonstration data for hackathon prototype testing.
Not live government emergency data.
"""

from typing import Dict, Any

DEMO_GEOJSON_LAYERS: Dict[str, Any] = {
    "disclaimer": "Demo Geospatial Layer — simulated coordinates for SIH prototype. Not live government emergency data.",
    "hotspots": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "HOT-IND-01",
                "geometry": {"type": "Point", "coordinates": [77.2090, 28.6139]},
                "properties": {
                    "incident_id": "industrial-001",
                    "title": "Refinery Furnace Flare Anomaly",
                    "classification": "Industrial Flare",
                    "temp_k": 322.5,
                    "frp_mw": 145.2,
                    "risk_index": 71.8,
                    "risk_level": "HIGH",
                    "confidence": 0.89,
                    "persistence": "Continuous operational flare",
                    "infrastructure": "Refinery Furnace Unit 4 & Gas Pipeline",
                    "evidence": [
                        "Point-source thermal peak at 322.5 K",
                        "High circular compactness ratio 0.85",
                        "Proximity (<200m) to chemical storage unit"
                    ]
                }
            },
            {
                "type": "Feature",
                "id": "HOT-FOR-01",
                "geometry": {"type": "Point", "coordinates": [80.9462, 26.8467]},
                "properties": {
                    "incident_id": "forest-001",
                    "title": "Canopy Moisture Baseline",
                    "classification": "Solar / Bare Soil",
                    "temp_k": 298.1,
                    "frp_mw": 0.0,
                    "risk_index": 18.5,
                    "risk_level": "LOW",
                    "confidence": 0.91,
                    "persistence": "Stable seasonal canopy background",
                    "infrastructure": "Forest Watch Tower & River Basin",
                    "evidence": [
                        "Uniform cool canopy background at 298.1 K",
                        "No localized thermal anomalies detected"
                    ]
                }
            },
            {
                "type": "Feature",
                "id": "HOT-AGR-01",
                "geometry": {"type": "Point", "coordinates": [77.5710, 29.9792]},
                "properties": {
                    "incident_id": "agri-001",
                    "title": "Harvest Stubble Burn Front",
                    "classification": "Crop Residue",
                    "temp_k": 317.4,
                    "frp_mw": 68.4,
                    "risk_index": 62.1,
                    "risk_level": "HIGH",
                    "confidence": 0.86,
                    "persistence": "Post-harvest seasonal pass",
                    "infrastructure": "Irrigation Canal & Secondary Highway",
                    "evidence": [
                        "Linear burn front pattern along plot edge",
                        "Local contrast delta +18.4 K above ambient soil"
                    ]
                }
            }
        ]
    },
    "industrial_zones": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "National Refinery Complex", "zone_type": "Refinery & Petrochemical"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [77.200, 28.605],
                        [77.218, 28.605],
                        [77.218, 28.622],
                        [77.200, 28.622],
                        [77.200, 28.605]
                    ]]
                }
            }
        ]
    },
    "forest_regions": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Terai Protected Forest Reserve", "zone_type": "Dense Canopy Forest"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [80.930, 26.830],
                        [80.965, 26.830],
                        [80.965, 26.860],
                        [80.930, 26.860],
                        [80.930, 26.830]
                    ]]
                }
            }
        ]
    },
    "agricultural_regions": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Doab Wheat Harvest Belt", "zone_type": "Irrigated Agriculture"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [77.550, 29.960],
                        [77.590, 29.960],
                        [77.590, 29.995],
                        [77.550, 29.995],
                        [77.550, 29.960]
                    ]]
                }
            }
        ]
    },
    "infrastructure": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Industrial Gas Pipeline Alpha", "type": "Pipeline"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[77.195, 28.600], [77.210, 28.615], [77.225, 28.630]]
                }
            },
            {
                "type": "Feature",
                "properties": {"name": "Irrigation Primary Canal", "type": "Waterway"},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[77.545, 29.955], [77.570, 29.980], [77.595, 30.000]]
                }
            }
        ]
    },
    "risk_zones": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "High Risk Industrial Buffer Zone", "risk_level": "HIGH", "radius_km": 1.5},
                "geometry": {"type": "Point", "coordinates": [77.2090, 28.6139]}
            },
            {
                "type": "Feature",
                "properties": {"name": "Moderate Agricultural Burn Perimeter", "risk_level": "MEDIUM", "radius_km": 1.0},
                "geometry": {"type": "Point", "coordinates": [77.5710, 29.9792]}
            }
        ]
    }
}
