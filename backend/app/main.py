"""IGNITE Backend — FastAPI Application."""
import json
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.pipeline import (
    validate_image,
    save_upload,
    load_image_cv2,
    preprocess,
    srm_prototype,
    image_to_base64,
    save_output,
    UPLOAD_DIR,
    OUTPUT_DIR,
)
from app.generate_demo import generate_all as generate_demo_images

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
DEMO_SCENES_FILE = BASE_DIR / "demo_scenes" / "demo_scenes.json"

# Ensure directories exist
STATIC_DIR.mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "outputs").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "demo").mkdir(parents=True, exist_ok=True)

# Generate demo images on startup if they don't exist
if not (STATIC_DIR / "demo" / "industrial.png").exists():
    generate_demo_images()

app = FastAPI(
    title="IGNITE Backend",
    version="0.1.0",
    description="Infrared Gradient Normalization and Intelligent Thermal Extraction",
)

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (demo images, processed outputs)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "IGNITE Earth-Observation Backend",
        "version": "0.1.0",
        "health": "/health",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "IGNITE Backend"}


from app.engines import engine_registry


@app.get("/api/model-pipeline/info")
async def get_model_pipeline_info():
    """Return model architecture specifications and engine status."""
    return {
        "disclaimer": "AI Architecture Specification — Components are explicitly marked as LIVE DEMO, ARCHITECTURE MODULE, or FUTURE MODEL.",
        "engines": engine_registry.list_engines(),
        "pipeline_nodes": [
            {"id": "satellite_data", "name": "Satellite Data", "type": "input", "status": "LIVE DEMO"},
            {"id": "qa_preprocess", "name": "QA / Preprocessing", "type": "process", "status": "LIVE DEMO"},
            {"id": "clahe_dwt", "name": "CLAHE / DWT", "type": "process", "status": "LIVE DEMO"},
            {"id": "feature_extraction", "name": "Feature Extraction", "type": "process", "status": "ARCHITECTURE MODULE"},
            {"id": "efficientnet_b3", "name": "EfficientNet-B3", "type": "model", "status": "ARCHITECTURE MODULE"},
            {"id": "cbam", "name": "CBAM", "type": "model", "status": "ARCHITECTURE MODULE"},
            {"id": "bifpn", "name": "BiFPN", "type": "model", "status": "ARCHITECTURE MODULE"},
            {"id": "mamba_ssm", "name": "Mamba SSM", "type": "model", "status": "FUTURE MODEL"},
            {"id": "srm_reconstruction", "name": "SRM Reconstruction", "type": "process", "status": "LIVE DEMO"},
            {"id": "patchgan", "name": "PatchGAN", "type": "model", "status": "FUTURE MODEL"},
            {"id": "thermal_intel", "name": "Thermal Intelligence", "type": "output", "status": "LIVE DEMO"},
            {"id": "risk_engine", "name": "Risk Engine", "type": "output", "status": "LIVE DEMO"},
        ]
    }


from app.geojson_layers import DEMO_GEOJSON_LAYERS


@app.get("/api/geojson-layers")
async def get_geojson_layers():
    """Return demonstration GeoJSON feature collections."""
    return DEMO_GEOJSON_LAYERS


@app.get("/api/demo-scenes")
async def get_demo_scenes():
    """Return list of prototype demonstration scenes."""
    if not DEMO_SCENES_FILE.exists():
        raise HTTPException(status_code=404, detail="Demo scenes data not found")
    data = json.loads(DEMO_SCENES_FILE.read_text(encoding="utf-8"))
    return {
        "disclaimer": "Prototype Demonstration Dataset — not real satellite imagery",
        **data,
    }


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload and validate a thermal/infrared image."""
    file_bytes = await file.read()
    validation = validate_image(file.filename or "unknown", file_bytes)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["errors"])
    meta = save_upload(file.filename or "upload.png", file_bytes)
    return {
        "status": "uploaded",
        "disclaimer": "Prototype Demonstration — uploaded image stored locally",
        **meta,
    }


@app.post("/api/preprocess")
async def preprocess_image(
    image_id: str = Query(..., description="Image ID from upload or demo scene ID"),
):
    """Run preprocessing pipeline on an uploaded image."""
    # Find the image file
    img_path = _resolve_image_path(image_id)
    if img_path is None:
        raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")

    img = load_image_cv2(str(img_path))
    result = preprocess(img)

    # Save preprocessed output
    out_url = save_output(result["image"], image_id, "preprocessed")
    b64 = image_to_base64(result["image"])

    return {
        "status": "preprocessed",
        "disclaimer": "Prototype preprocessing pipeline",
        "image_url": out_url,
        "image_base64": b64,
        "original_base64": image_to_base64(img),
        "metadata": result["metadata"],
    }


@app.post("/api/srm")
async def run_srm(
    image_id: str = Query(..., description="Image ID from upload or demo scene ID"),
    scale_factor: int = Query(2, ge=2, le=4, description="Upscale factor (2 or 4)"),
):
    """Run prototype SRM pipeline on an image."""
    img_path = _resolve_image_path(image_id)
    if img_path is None:
        raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")

    img = load_image_cv2(str(img_path))

    # Preprocess first
    pre = preprocess(img)

    # Run SRM prototype
    srm = srm_prototype(pre["image"], scale_factor=scale_factor)

    # Save outputs
    original_url = image_to_base64(img)
    baseline_url = save_output(srm["baseline"], image_id, "baseline")
    enhanced_url = save_output(srm["enhanced"], image_id, "srm_enhanced")

    return {
        "status": "completed",
        "disclaimer": (
            "Prototype SRM Visualization — this output is NOT produced by a "
            "scientifically-trained super-resolution network. It uses bicubic "
            "upscaling with edge and detail enhancement filters for demonstration."
        ),
        "original_base64": original_url,
        "baseline_base64": image_to_base64(srm["baseline"]),
        "enhanced_base64": image_to_base64(srm["enhanced"]),
        "baseline_url": baseline_url,
        "enhanced_url": enhanced_url,
        "preprocess_metadata": pre["metadata"],
        "srm_metadata": srm["metadata"],
    }


from app.classifier import classify_thermal_scene, TARGET_CLASSES


@app.post("/api/classify")
async def classify_scene(
    image_id: str = Query(..., description="Image ID from upload or demo scene ID"),
    land_context: str = Query("", description="Land context hint (e.g. Industrial, Forest, Agricultural)"),
):
    """Run deterministic thermal intelligence classifier on a scene."""
    img_path = _resolve_image_path(image_id)
    if img_path is None:
        raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")

    img = load_image_cv2(str(img_path))

    # Look up scene metadata for coordinates if available
    coords = ""
    if DEMO_SCENES_FILE.exists():
        try:
            data = json.loads(DEMO_SCENES_FILE.read_text(encoding="utf-8"))
            for s in data.get("scenes", []):
                if s["id"] == image_id:
                    coords = s.get("coordinates", "")
                    if not land_context:
                        land_context = s.get("land_context", "")
                    break
        except Exception:
            pass

    res = classify_thermal_scene(
        img=img,
        image_id=image_id,
        land_context=land_context,
        coordinates=coords,
    )
    return {
        "status": "classified",
        "supported_classes": TARGET_CLASSES,
        **res
    }


from app.risk_engine import calculate_risk_index


@app.post("/api/risk")
async def compute_risk(
    thermal_intensity: float = Query(300.0, description="Max temperature in Kelvin"),
    hotspot_area_pct: float = Query(0.5, description="Hotspot percentage of scene area"),
    classification: str = Query("Solar / Bare Soil", description="Classified anomaly type"),
    confidence: float = Query(0.8, description="Prototype confidence score"),
    persistence: str = Query("Transient", description="Persistence profile"),
    context: str = Query("", description="Land use context"),
    infrastructure_proximity: str = Query("Medium", description="Proximity rating: High, Medium, Low"),
):
    """Compute Prototype Risk Index and factor breakdown."""
    risk_res = calculate_risk_index(
        thermal_intensity=thermal_intensity,
        hotspot_area_pct=hotspot_area_pct,
        classification=classification,
        confidence=confidence,
        persistence=persistence,
        context=context,
        infrastructure_proximity=infrastructure_proximity,
    )
    return {
        "status": "computed",
        **risk_res
    }


@app.post("/api/analyze")
async def analyze_full_scene(
    image_id: str = Query(..., description="Image ID from upload or demo scene ID"),
    scale_factor: int = Query(2, ge=2, le=4, description="SRM upscale factor"),
    land_context: str = Query("", description="Land context hint"),
    infrastructure_proximity: str = Query("Medium", description="Proximity rating: High, Medium, Low"),
):
    """Unified Analysis Endpoint: Runs SRM + Classification + Risk Engine in one call."""
    img_path = _resolve_image_path(image_id)
    if img_path is None:
        raise HTTPException(status_code=404, detail=f"Image not found: {image_id}")

    img = load_image_cv2(str(img_path))

    # 1. SRM & Preprocess Pipeline
    pre = preprocess(img)
    srm = srm_prototype(pre["image"], scale_factor=scale_factor)

    # 2. Scene metadata resolution
    coords = ""
    if DEMO_SCENES_FILE.exists():
        try:
            data = json.loads(DEMO_SCENES_FILE.read_text(encoding="utf-8"))
            for s in data.get("scenes", []):
                if s["id"] == image_id:
                    coords = s.get("coordinates", "")
                    if not land_context:
                        land_context = s.get("land_context", "")
                    break
        except Exception:
            pass

    # 3. Classification
    class_res = classify_thermal_scene(
        img=img,
        image_id=image_id,
        land_context=land_context,
        coordinates=coords
    )

    # 4. Risk Engine Calculation
    feats = class_res["extracted_features"]
    risk_res = calculate_risk_index(
        thermal_intensity=feats["max_temp_k"],
        hotspot_area_pct=feats["hotspot_area_pct"],
        classification=class_res["classification"],
        confidence=class_res["prototype_confidence"],
        persistence=class_res["temporal_context"],
        context=land_context,
        infrastructure_proximity=infrastructure_proximity,
    )

    # Combined Evidence
    combined_evidence = class_res["evidence"] + risk_res["evidence_breakdown"]

    return {
        "status": "analysis_completed",
        "image_id": image_id,
        "disclaimer": "Unified Prototype Analysis — SRM + Classification + Risk Index.",
        "srm": {
            "disclaimer": srm["metadata"]["model_type"],
            "original_base64": image_to_base64(img),
            "baseline_base64": image_to_base64(srm["baseline"]),
            "enhanced_base64": image_to_base64(srm["enhanced"]),
            "scale_factor": scale_factor,
            "preprocess_metadata": pre["metadata"],
            "srm_metadata": srm["metadata"],
        },
        "classification": {
            "name": class_res["classification"],
            "prototype_confidence": class_res["prototype_confidence"],
            "risk_level": class_res["risk_level"],
            "model_mode": class_res["model_mode"],
            "extracted_features": feats,
            "spatial_context": class_res["spatial_context"],
            "temporal_context": class_res["temporal_context"],
            "coordinates": class_res["coordinates"],
        },
        "risk": risk_res,
        "evidence": combined_evidence,
    }


from fastapi.responses import HTMLResponse
from app.pdf_report import generate_html_report


@app.get("/api/report-html/{image_id}", response_class=HTMLResponse)
async def get_printable_report(image_id: str):
    """Generate printable HTML/PDF report for an incident analysis."""
    analysis = await analyze_full_scene(image_id=image_id, scale_factor=2, land_context="", infrastructure_proximity="Medium")
    return generate_html_report(analysis)





def _resolve_image_path(image_id: str) -> Path | None:
    """Resolve an image ID to a file path. Checks uploads then demo scenes."""
    # Check uploads directory
    for f in UPLOAD_DIR.iterdir():
        if f.name.startswith(image_id):
            return f
    # Check demo scenes
    demo_map = {
        "industrial-001": STATIC_DIR / "demo" / "industrial.png",
        "forest-001": STATIC_DIR / "demo" / "forest.png",
        "agri-001": STATIC_DIR / "demo" / "agri.png",
    }
    return demo_map.get(image_id)
