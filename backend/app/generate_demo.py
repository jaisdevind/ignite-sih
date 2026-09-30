"""Generate synthetic demonstration thermal images.

These are clearly PROTOTYPE assets — not real satellite imagery.
They simulate thermal gradients, hotspots, and land patterns
for demonstration purposes only.
"""
import numpy as np
from PIL import Image
from pathlib import Path

DEMO_DIR = Path(__file__).resolve().parent.parent / "static" / "demo"


def _apply_thermal_colormap(temp_array: np.ndarray) -> np.ndarray:
    """Map a 0-1 temperature array to a thermal color palette (blue→cyan→yellow→red)."""
    h, w = temp_array.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    # Blue (cold) → Cyan → Yellow → Red (hot)
    r = np.clip((temp_array - 0.4) / 0.3, 0, 1)  # ramp from 0.4 to 0.7
    g = np.where(temp_array < 0.5,
                 np.clip(temp_array / 0.5, 0, 1),
                 np.clip((1.0 - temp_array) / 0.3, 0, 1))
    b = np.clip((0.5 - temp_array) / 0.5, 0, 1)
    rgb[:, :, 0] = (r * 255).astype(np.uint8)
    rgb[:, :, 1] = (g * 255).astype(np.uint8)
    rgb[:, :, 2] = (b * 255).astype(np.uint8)
    return rgb


def _add_noise(arr: np.ndarray, sigma: float = 0.03) -> np.ndarray:
    noise = np.random.normal(0, sigma, arr.shape)
    return np.clip(arr + noise, 0, 1)


def generate_industrial(size: int = 128) -> np.ndarray:
    """Industrial scene: base warm + two hot rectangular hotspots."""
    np.random.seed(42)
    temp = np.full((size, size), 0.45)  # warm base
    # gradient from left to right
    for x in range(size):
        temp[:, x] += 0.05 * (x / size)
    # Hotspot 1 (furnace)
    temp[30:55, 70:95] = 0.85
    # Hotspot 2 (chimney)
    temp[80:95, 40:55] = 0.78
    # Some structure lines (roads/buildings)
    temp[60:62, :] = 0.55
    temp[:, 50:52] = 0.55
    temp = _add_noise(temp, 0.04)
    return _apply_thermal_colormap(temp)


def generate_forest(size: int = 128) -> np.ndarray:
    """Forest scene: cool canopy with river."""
    np.random.seed(123)
    temp = np.full((size, size), 0.30)  # cool base
    # Varied canopy
    for y in range(size):
        for x in range(size):
            temp[y, x] += 0.05 * np.sin(x / 8.0) * np.cos(y / 10.0)
    # River (cooler)
    for x in range(size):
        cy = int(64 + 15 * np.sin(x / 15.0))
        temp[max(0, cy-3):min(size, cy+3), x] = 0.15
    temp = _add_noise(temp, 0.02)
    return _apply_thermal_colormap(temp)


def generate_agricultural(size: int = 128) -> np.ndarray:
    """Agricultural scene: field strips with one pump hotspot."""
    np.random.seed(777)
    temp = np.full((size, size), 0.40)
    # Alternating crop strips
    for i in range(0, size, 16):
        if (i // 16) % 2 == 0:
            temp[i:i+16, :] = 0.38
        else:
            temp[i:i+16, :] = 0.45
    # Irrigation canal
    temp[:, 62:66] = 0.20
    # Pump hotspot
    cy, cx = 90, 64
    yy, xx = np.ogrid[:size, :size]
    dist = np.sqrt((yy - cy)**2 + (xx - cx)**2)
    hotspot_mask = dist < 8
    temp[hotspot_mask] = 0.80
    temp = _add_noise(temp, 0.03)
    return _apply_thermal_colormap(temp)


def generate_all():
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    scenes = {
        "industrial.png": generate_industrial,
        "forest.png": generate_forest,
        "agri.png": generate_agricultural,
    }
    for fname, gen_fn in scenes.items():
        rgb = gen_fn(128)
        img = Image.fromarray(rgb, "RGB")
        img.save(DEMO_DIR / fname)
        print(f"Generated {DEMO_DIR / fname}")


if __name__ == "__main__":
    generate_all()
