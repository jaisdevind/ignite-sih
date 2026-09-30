const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/+$/, '');

export async function fetchDemoScenes() {
  const res = await fetch(`${API_BASE}/api/demo-scenes`);
  if (!res.ok) throw new Error(`Failed to fetch demo scenes: ${res.statusText}`);
  return res.json();
}

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(Array.isArray(err.detail) ? err.detail.join(', ') : err.detail || res.statusText);
  }
  return res.json();
}

export async function runPreprocess(imageId: string) {
  const res = await fetch(`${API_BASE}/api/preprocess?image_id=${encodeURIComponent(imageId)}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Preprocess failed: ${res.statusText}`);
  return res.json();
}

export async function runSRM(imageId: string, scaleFactor: number = 2) {
  const res = await fetch(
    `${API_BASE}/api/srm?image_id=${encodeURIComponent(imageId)}&scale_factor=${scaleFactor}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`SRM failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModelPipelineInfo() {
  const res = await fetch(`${API_BASE}/api/model-pipeline/info`);
  if (!res.ok) throw new Error(`Failed to fetch model pipeline info: ${res.statusText}`);
  return res.json();
}

export async function fetchGeoJSONLayers() {
  const res = await fetch(`${API_BASE}/api/geojson-layers`);
  if (!res.ok) throw new Error(`Failed to fetch GeoJSON layers: ${res.statusText}`);
  return res.json();
}

export async function runClassify(imageId: string, landContext: string = '') {
  const res = await fetch(
    `${API_BASE}/api/classify?image_id=${encodeURIComponent(imageId)}&land_context=${encodeURIComponent(landContext)}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Classification failed: ${res.statusText}`);
  return res.json();
}

export async function runRisk(params: {
  thermal_intensity?: number;
  hotspot_area_pct?: number;
  classification?: string;
  confidence?: number;
  persistence?: string;
  context?: string;
  infrastructure_proximity?: string;
}) {
  const query = new URLSearchParams();
  if (params.thermal_intensity) query.append('thermal_intensity', params.thermal_intensity.toString());
  if (params.hotspot_area_pct) query.append('hotspot_area_pct', params.hotspot_area_pct.toString());
  if (params.classification) query.append('classification', params.classification);
  if (params.confidence) query.append('confidence', params.confidence.toString());
  if (params.persistence) query.append('persistence', params.persistence);
  if (params.context) query.append('context', params.context);
  if (params.infrastructure_proximity) query.append('infrastructure_proximity', params.infrastructure_proximity);

  const res = await fetch(`${API_BASE}/api/risk?${query.toString()}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Risk calculation failed: ${res.statusText}`);
  return res.json();
}

export async function runAnalyze(imageId: string, scaleFactor: number = 2, landContext: string = '', proximity: string = 'Medium') {
  const query = new URLSearchParams({
    image_id: imageId,
    scale_factor: scaleFactor.toString(),
    land_context: landContext,
    infrastructure_proximity: proximity,
  });
  const res = await fetch(`${API_BASE}/api/analyze?${query.toString()}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Unified analysis failed: ${res.statusText}`);
  return res.json();
}
