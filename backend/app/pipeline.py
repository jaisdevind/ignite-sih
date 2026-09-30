"""IGNITE Image Processing Pipeline.

This module implements prototype image processing operations.
All outputs are clearly labelled as prototype/demonstration.
No scientifically-trained SRM weights are used.
"""
import io
import uuid
import time
import base64
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "data" / "uploads"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "outputs"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def validate_image(filename: str, file_bytes: bytes) -> dict:
    """Validate uploaded image file."""
    errors = []
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"Unsupported file type: {ext}")
    if len(file_bytes) > MAX_FILE_SIZE:
        errors.append(f"File size {len(file_bytes)} exceeds max {MAX_FILE_SIZE}")
    if len(file_bytes) == 0:
        errors.append("File is empty")
    # Try to open with PIL to verify it's a valid image
    if not errors:
        try:
            img = Image.open(io.BytesIO(file_bytes))
            img.verify()
        except Exception as e:
            errors.append(f"Invalid image data: {str(e)}")
    return {"valid": len(errors) == 0, "errors": errors}


def save_upload(filename: str, file_bytes: bytes) -> dict:
    """Save uploaded file and return metadata."""
    uid = uuid.uuid4().hex[:12]
    ext = Path(filename).suffix.lower()
    safe_name = f"{uid}{ext}"
    path = UPLOAD_DIR / safe_name
    path.write_bytes(file_bytes)
    # Read image info
    img = Image.open(path)
    return {
        "id": uid,
        "filename": safe_name,
        "original_name": filename,
        "path": str(path),
        "width": img.width,
        "height": img.height,
        "mode": img.mode,
        "format": img.format or ext.replace(".", "").upper(),
    }


def load_image_cv2(path: str) -> np.ndarray:
    """Load image as BGR numpy array."""
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {path}")
    return img


def normalize(img: np.ndarray) -> np.ndarray:
    """Normalize pixel values to 0-1 float32 range."""
    return img.astype(np.float32) / 255.0


def denormalize(img: np.ndarray) -> np.ndarray:
    """Convert 0-1 float back to uint8."""
    return np.clip(img * 255.0, 0, 255).astype(np.uint8)


def denoise(img: np.ndarray) -> np.ndarray:
    """Apply bilateral filtering for edge-preserving denoising."""
    if img.dtype == np.float32:
        img_u8 = denormalize(img)
    else:
        img_u8 = img
    denoised = cv2.bilateralFilter(img_u8, d=9, sigmaColor=75, sigmaSpace=75)
    if img.dtype == np.float32:
        return normalize(denoised)
    return denoised


def enhance_contrast(img: np.ndarray) -> np.ndarray:
    """Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)."""
    if img.dtype == np.float32:
        img_u8 = denormalize(img)
    else:
        img_u8 = img.copy()
    # Convert to LAB, apply CLAHE to L channel
    lab = cv2.cvtColor(img_u8, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)
    lab_enhanced = cv2.merge([l_enhanced, a, b])
    result = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    if img.dtype == np.float32:
        return normalize(result)
    return result


def preprocess(img: np.ndarray) -> dict:
    """Run full preprocessing: normalize → denoise → contrast enhance."""
    t0 = time.time()
    normed = normalize(img)
    denoised = denoise(normed)
    enhanced = enhance_contrast(denoised)
    result_u8 = denormalize(enhanced)
    elapsed = round(time.time() - t0, 3)
    return {
        "image": result_u8,
        "metadata": {
            "steps": ["normalization", "bilateral_denoise", "CLAHE_contrast"],
            "processing_time_s": elapsed,
            "output_shape": list(result_u8.shape),
        },
    }


def bicubic_upscale(img: np.ndarray, factor: int = 2) -> np.ndarray:
    """Baseline bicubic upscale."""
    h, w = img.shape[:2]
    return cv2.resize(img, (w * factor, h * factor), interpolation=cv2.INTER_CUBIC)


def enhance_edges(img: np.ndarray, strength: float = 0.4) -> np.ndarray:
    """Unsharp-mask based edge/detail enhancement."""
    if img.dtype != np.float32:
        img_f = normalize(img)
    else:
        img_f = img.copy()
    blurred = cv2.GaussianBlur(img_f, (0, 0), sigmaX=3)
    sharpened = cv2.addWeighted(img_f, 1.0 + strength, blurred, -strength, 0)
    sharpened = np.clip(sharpened, 0, 1)
    return sharpened


def enhance_details(img: np.ndarray) -> np.ndarray:
    """Additional detail enhancement using guided-filter-like bilateral approach."""
    if img.dtype == np.float32:
        img_u8 = denormalize(img)
    else:
        img_u8 = img.copy()
    # Detail layer extraction
    base = cv2.bilateralFilter(img_u8, d=5, sigmaColor=50, sigmaSpace=50)
    detail = cv2.subtract(img_u8, base)
    # Amplify detail
    boosted = cv2.add(img_u8, detail)
    if img.dtype == np.float32:
        return normalize(boosted)
    return boosted


def srm_prototype(img: np.ndarray, scale_factor: int = 2) -> dict:
    """Prototype SRM pipeline: bicubic upscale → edge enhance → detail enhance.
    
    NOTE: This is a PROTOTYPE demonstration pipeline.
    It does NOT use scientifically-trained super-resolution weights.
    The output is an enhanced bicubic upscale with sharpening filters,
    intended to demonstrate the application workflow.
    """
    t0 = time.time()
    
    # Step 1: Bicubic baseline
    baseline = bicubic_upscale(img, factor=scale_factor)
    
    # Step 2: Normalize for processing
    baseline_f = normalize(baseline)
    
    # Step 3: Edge enhancement (unsharp mask)
    edge_enhanced = enhance_edges(baseline_f, strength=0.5)
    
    # Step 4: Detail enhancement
    detail_enhanced = enhance_details(edge_enhanced)
    
    # Step 5: Final contrast pass
    final = enhance_contrast(detail_enhanced)
    final_u8 = denormalize(final) if final.dtype == np.float32 else final
    
    elapsed = round(time.time() - t0, 3)
    
    return {
        "baseline": denormalize(normalize(baseline)),
        "enhanced": final_u8,
        "metadata": {
            "pipeline": "Prototype SRM Visualization",
            "model_type": "Prototype / Demonstration Model — no trained SR weights",
            "steps": [
                f"bicubic_upscale_x{scale_factor}",
                "unsharp_mask_edge_enhancement",
                "bilateral_detail_boost",
                "CLAHE_contrast_pass",
            ],
            "scale_factor": scale_factor,
            "input_shape": list(img.shape),
            "output_shape": list(final_u8.shape),
            "processing_time_s": elapsed,
        },
    }


def image_to_base64(img: np.ndarray, fmt: str = ".png") -> str:
    """Encode a cv2 image to base64 data-URI string."""
    _, buf = cv2.imencode(fmt, img)
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    mime = "image/png" if fmt == ".png" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


def save_output(img: np.ndarray, uid: str, suffix: str) -> str:
    """Save a processed image to disk and return relative path."""
    fname = f"{uid}_{suffix}.png"
    path = OUTPUT_DIR / fname
    cv2.imwrite(str(path), img)
    return f"/static/outputs/{fname}"
