"""IGNITE Incident PDF/HTML Report Generator.

Generates a formatted SIH 2026 Demonstration Incident Summary Report suitable for printing or PDF export.
Includes:
- Project Identity & Problem Statement (SIH26142)
- Scene & Sensor Metadata
- SRM Before/After Comparison Image Rasters
- Explainable Thermal Feature Matrix
- Anomaly Classification & Prototype Confidence
- Multi-Factor Risk Index & Factor Breakdown Chart
- Forensic Diagnostic Evidence Log
- Mandatory Prototype Disclaimers
"""

from typing import Dict, Any


def generate_html_report(analysis_data: Dict[str, Any]) -> str:
    """Generate printable HTML report for an incident analysis result."""

    img_id = analysis_data.get("image_id", "UNKNOWN")
    cls_data = analysis_data.get("classification", {})
    risk_data = analysis_data.get("risk", {})
    srm_data = analysis_data.get("srm", {})
    feats = cls_data.get("extracted_features", {})

    factors = risk_data.get("contributing_factors", [])
    evidence = analysis_data.get("evidence", [])

    orig_img = srm_data.get("original_base64", "")
    srm_img = srm_data.get("enhanced_base64", "")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>IGNITE — SIH 2026 Incident Report ({img_id})</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            color: #0f172a;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }}
        .header-title {{
            font-size: 24px;
            font-weight: bold;
            color: #0f172a;
        }}
        .header-sub {{
            font-size: 12px;
            color: #64748b;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .badge-critical {{ background-color: #fee2e2; color: #991b1b; border: 1px solid #f87171; }}
        .badge-high {{ background-color: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }}
        .badge-medium {{ background-color: #fef9c3; color: #854d0e; border: 1px solid #facc15; }}
        .badge-low {{ background-color: #dcfce7; color: #166534; border: 1px solid #4ade80; }}

        .disclaimer-box {{
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 11px;
            color: #92400e;
            margin-bottom: 20px;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }}
        .card {{
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            background-color: #f8fafc;
        }}
        .card-title {{
            font-size: 13px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }}
        .metric-val {{
            font-size: 20px;
            font-weight: bold;
            font-family: monospace;
        }}
        .img-container {{
            width: 100%;
            height: 220px;
            object-fit: contain;
            background-color: #0f172a;
            border-radius: 6px;
        }}
        .factor-bar {{
            height: 8px;
            background-color: #cbd5e1;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        }}
        .factor-fill {{
            height: 100%;
            background-color: #0ea5e9;
        }}
        .evidence-list {{
            font-size: 11px;
            line-height: 1.6;
            color: #334155;
            padding-left: 18px;
        }}
        @media print {{
            body {{ padding: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 16px;">
        <button onclick="window.print()" style="background-color: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
        </button>
    </div>

    <div class="header">
        <div>
            <div class="header-title">IGNITE — Incident Analysis Report</div>
            <div class="header-sub">Smart India Hackathon 2026 • Problem Statement SIH26142 • Team IGNITE</div>
        </div>
        <div>
            <span class="badge badge-{risk_data.get('risk_level', 'LOW').lower()}">
                {risk_data.get('risk_level', 'LOW')} RISK ({risk_data.get('risk_index', 0)}/100)
            </span>
        </div>
    </div>

    <div class="disclaimer-box">
        <strong>PROTOTYPE REPORT DISCLAIMER:</strong> This report is generated by the IGNITE SIH Demonstration Prototype. All super-resolved visualizations, classification outputs, and risk indices are decision-support outputs intended for hackathon demonstration. Not certified live government emergency data.
    </div>

    <div class="grid-2">
        <div class="card">
            <div class="card-title">Original Satellite Thermal Input</div>
            <img src="{orig_img}" class="img-container" alt="Original Input">
        </div>
        <div class="card">
            <div class="card-title">Super-Resolution Mapping (SRM) Output</div>
            <img src="{srm_img}" class="img-container" alt="SRM Enhanced">
        </div>
    </div>

    <div class="grid-2">
        <div class="card">
            <div class="card-title">Thermal Classification Summary</div>
            <p><strong>Predicted Anomaly:</strong> {cls_data.get('name', 'N/A')}</p>
            <p><strong>Prototype Confidence:</strong> {round(cls_data.get('prototype_confidence', 0)*100)}%</p>
            <p><strong>Max Surface Temp:</strong> <span class="metric-val" style="color: #dc2626;">{feats.get('max_temp_k', 300)} K</span></p>
            <p><strong>Local Thermal Delta:</strong> +{feats.get('local_contrast_k', 0)} K</p>
            <p><strong>Spatial Matrix:</strong> {cls_data.get('spatial_context', 'N/A')}</p>
            <p><strong>Coordinates:</strong> {cls_data.get('coordinates', 'N/A')}</p>
        </div>

        <div class="card">
            <div class="card-title">Prototype Risk Index & Factor Breakdown</div>
            <p><strong>Overall Risk Score:</strong> <span class="metric-val" style="color: #0ea5e9;">{risk_data.get('risk_index', 0)} / 100</span></p>
            {''.join([f'''
            <div style="margin-bottom: 8px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>{f['factor']} ({f['weight_pct']}%)</span>
                    <span>+{f['contribution_points']} pts</span>
                </div>
                <div class="factor-bar">
                    <div class="factor-fill" style="width: {f['score']}%;"></div>
                </div>
            </div>
            ''' for f in factors])}
        </div>
    </div>

    <div class="card">
        <div class="card-title">Explainable Diagnostic Evidence Log</div>
        <ul class="evidence-list">
            {''.join([f'<li>{ev}</li>' for ev in evidence])}
        </ul>
    </div>
</body>
</html>
"""
    return html_content
