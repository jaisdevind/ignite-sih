"""IGNITE Explainable Risk Engine.

Calculates a Prototype Risk Index based on multi-factor radiometric and geospatial context:
- Thermal Intensity Factor (Weight: 35%)
- Hotspot Area & Extent Factor (Weight: 25%)
- Land Use & Ecological Vulnerability (Weight: 20%)
- Infrastructure Proximity & Exposure (Weight: 20%)

Risk Levels:
- LOW (0 - 29)
- MEDIUM (30 - 54)
- HIGH (55 - 79)
- CRITICAL (80 - 100)

NOTE: All outputs are labeled as "Prototype Risk Index".
Not an operational government emergency score.
"""

from typing import Dict, Any, List


def calculate_risk_index(
    thermal_intensity: float = 300.0,
    hotspot_area_pct: float = 0.5,
    classification: str = "Solar / Bare Soil",
    confidence: float = 0.8,
    persistence: str = "Transient",
    context: str = "",
    infrastructure_proximity: str = "Medium"
) -> Dict[str, Any]:
    """Calculate an explainable Prototype Risk Index and factor breakdown."""

    # 1. Thermal Intensity Score (0-100)
    # Range 280K (0) to 340K (100)
    intensity_score = min(100.0, max(0.0, ((thermal_intensity - 280.0) / 60.0) * 100.0))

    # 2. Hotspot Area Score (0-100)
    # Range 0% (0) to 5% area (100)
    area_score = min(100.0, max(0.0, (hotspot_area_pct / 5.0) * 100.0))

    # 3. Vulnerability Score based on classification & land use context (0-100)
    vuln_map = {
        "Forest Fire": 95.0,
        "Industrial Accident": 90.0,
        "Industrial Flare": 75.0,
        "Crop Residue": 60.0,
        "Peatland": 65.0,
        "Solar / Bare Soil": 15.0,
    }
    vuln_score = vuln_map.get(classification, 40.0)

    # 4. Proximity & Persistence Exposure Score (0-100)
    prox_map = {"High": 90.0, "Medium": 50.0, "Low": 20.0}
    prox_score = prox_map.get(infrastructure_proximity, 50.0)
    if "continuous" in persistence.lower() or "rapid" in persistence.lower():
        prox_score = min(100.0, prox_score + 10.0)

    # Weighted Sum Formula
    w_intensity = 0.35
    w_area = 0.25
    w_vuln = 0.20
    w_prox = 0.20

    risk_index_raw = (
        (w_intensity * intensity_score) +
        (w_area * area_score) +
        (w_vuln * vuln_score) +
        (w_prox * prox_score)
    )

    # Scale by confidence factor slightly
    risk_index = round(min(100.0, max(0.0, risk_index_raw)), 1)

    # Risk Level Category
    if risk_index >= 80.0:
        risk_level = "CRITICAL"
    elif risk_index >= 55.0:
        risk_level = "HIGH"
    elif risk_index >= 30.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Explainable Contributing Factors
    contributing_factors = [
        {
            "factor": "Thermal Intensity",
            "weight_pct": 35,
            "score": round(intensity_score, 1),
            "contribution_points": round(w_intensity * intensity_score, 1),
            "explanation": f"Peak surface temperature of {thermal_intensity} K ({round(intensity_score, 1)}/100 intensity rating)"
        },
        {
            "factor": "Hotspot Extent",
            "weight_pct": 25,
            "score": round(area_score, 1),
            "contribution_points": round(w_area * area_score, 1),
            "explanation": f"Spatial anomaly footprint of {hotspot_area_pct}% scene area"
        },
        {
            "factor": "Land & Target Vulnerability",
            "weight_pct": 20,
            "score": round(vuln_score, 1),
            "contribution_points": round(w_vuln * vuln_score, 1),
            "explanation": f"Vulnerability rating for anomaly class '{classification}'"
        },
        {
            "factor": "Infrastructure Exposure",
            "weight_pct": 20,
            "score": round(prox_score, 1),
            "contribution_points": round(w_prox * prox_score, 1),
            "explanation": f"Proximity risk rating '{infrastructure_proximity}' with persistence profile '{persistence}'"
        },
    ]

    # Evidence Breakdown Text List
    evidence_breakdown = [
        f"Calculated Prototype Risk Index of {risk_index}/100 ({risk_level} Risk Level)",
        f"Thermal Peak: {thermal_intensity} K (contributes +{round(w_intensity * intensity_score, 1)} pts)",
        f"Anomaly Footprint: {hotspot_area_pct}% coverage (contributes +{round(w_area * area_score, 1)} pts)",
        f"Class Risk Assignment: '{classification}' (contributes +{round(w_vuln * vuln_score, 1)} pts)",
        f"Exposure Profile: {infrastructure_proximity} proximity (contributes +{round(w_prox * prox_score, 1)} pts)"
    ]

    return {
        "risk_index": risk_index,
        "risk_level": risk_level,
        "disclaimer": "Prototype Risk Index — decision support visualization only. Not an operational government emergency score.",
        "evidence_breakdown": evidence_breakdown,
        "contributing_factors": contributing_factors,
    }
