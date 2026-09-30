import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fetchDemoScenes, uploadImage, runClassify } from '../lib/api';

interface DemoScene {
  id: string;
  title: string;
  coordinates: string;
  acquisition_date: string;
  source_type: string;
  image_path: string;
  thermal_info: string;
  hotspots: string;
  land_context: string;
}

interface ClassificationResult {
  classification: string;
  prototype_confidence: number;
  model_mode: string;
  disclaimer: string;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Severe';
  evidence: string[];
  extracted_features: {
    min_temp_k: number;
    max_temp_k: number;
    mean_temp_k: number;
    local_contrast_k: number;
    hotspot_count: number;
    hotspot_area_pct: number;
    compactness: number;
    texture_var: number;
    land_context_hint: string;
  };
  spatial_context: string;
  temporal_context: string;
  coordinates: string;
  supported_classes: string[];
}

const TARGET_CLASSES = [
  { name: 'Forest Fire', icon: '🔥', risk: 'Severe', desc: 'Active biomass combustion front' },
  { name: 'Crop Residue', icon: '🌾', risk: 'High', desc: 'Post-harvest agricultural burning' },
  { name: 'Industrial Flare', icon: '🏭', risk: 'High', desc: 'Refining / furnace point-source flare' },
  { name: 'Industrial Accident', icon: '🚨', risk: 'Severe', desc: 'Uncontrolled industrial thermal leakage' },
  { name: 'Peatland', icon: '🌿', risk: 'Moderate', desc: 'Subsurface smoldering organic wetland' },
  { name: 'Solar / Bare Soil', icon: '☀️', risk: 'Low', desc: 'Sun-lit soil diurnal heating' },
];

export default function ThermalIntelligence() {
  const [scenes, setScenes] = useState<DemoScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<DemoScene | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoScenes()
      .then((data) => {
        const sc = data.scenes || [];
        setScenes(sc);
        if (sc.length > 0) {
          // Select first scene by default
          setSelectedScene(sc[0]);
          setImageId(sc[0].id);
          setPreviewUrl(`http://localhost:8000${sc[0].image_path}`);
        }
      })
      .catch((err) => setError(`Failed to load demo scenes: ${err.message}`));
  }, []);

  const handleSelectScene = (scene: DemoScene) => {
    setSelectedScene(scene);
    setImageId(scene.id);
    setPreviewUrl(`http://localhost:8000${scene.image_path}`);
    setResult(null);
    setError(null);
  };

  const handleRunClassification = async () => {
    if (!imageId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await runClassify(imageId, selectedScene?.land_context || '');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Severe':
        return <Badge variant="danger">Severe Risk</Badge>;
      case 'High':
        return <Badge variant="warning">High Risk</Badge>;
      case 'Moderate':
        return <Badge variant="info">Moderate Risk</Badge>;
      default:
        return <Badge variant="success">Low Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thermal Intelligence & Anomaly Classifier</h2>
          <p className="text-sm text-gray-400 mt-1">
            Explainable Radiometric Feature Extraction & Thermal Risk Classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Prototype Inference</Badge>
          <Badge variant="neutral">6 Target Classes</Badge>
        </div>
      </div>

      {/* Target Classes Matrix */}
      <Card title="Target Thermal Anomaly Classes">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {TARGET_CLASSES.map((cls) => {
            const isMatched = result?.classification === cls.name;
            return (
              <div
                key={cls.name}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isMatched
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                    : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{cls.icon}</div>
                <h4 className="text-xs font-bold text-gray-200">{cls.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{cls.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scene Selector & Preview */}
        <div className="space-y-4">
          <Card title="Select Thermal Scene">
            <div className="space-y-2 mb-4">
              {scenes.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScene(sc)}
                  className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${
                    selectedScene?.id === sc.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-gray-800 hover:border-gray-700 text-gray-300 bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sc.title}</span>
                    <span className="text-[10px] font-mono text-gray-500">{sc.id}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{sc.coordinates}</div>
                </button>
              ))}
            </div>

            <Button onClick={handleRunClassification} loading={loading} className="w-full">
              Run Thermal Classification
            </Button>
          </Card>

          {previewUrl && (
            <Card title="Thermal Input Preview">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2">
                  <Badge variant="neutral">{selectedScene?.source_type || 'Thermal Source'}</Badge>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Classification Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {/* Result Banner */}
              <Card className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {TARGET_CLASSES.find((c) => c.name === result.classification)?.icon || '🔍'}
                    </div>
                    <div>
                      <span className="text-xs uppercase font-mono tracking-wider text-gray-400">Classification Result</span>
                      <h3 className="text-2xl font-bold text-gray-100">{result.classification}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{result.model_mode}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Prototype Confidence:</span>
                      <span className="text-lg font-bold text-sky-400">
                        {Math.round(result.prototype_confidence * 100)}%
                      </span>
                    </div>
                    <div>{getRiskBadge(result.risk_level)}</div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-amber-300/90 italic">
                  ⚠ {result.disclaimer}
                </div>
              </Card>

              {/* Feature Metrics Grid */}
              <Card title="Explainable Radiometric Feature Indicators">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block">Max Temperature</span>
                    <span className="text-lg font-bold font-mono text-red-400">
                      {result.extracted_features.max_temp_k} K
                    </span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block">Local Contrast</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      +{result.extracted_features.local_contrast_k} K
                    </span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block">Hotspot Footprint</span>
                    <span className="text-lg font-bold font-mono text-sky-400">
                      {result.extracted_features.hotspot_area_pct}%
                    </span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-500 uppercase block">Compactness Ratio</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {result.extracted_features.compactness}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Evidence & Context Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Evidence Points */}
                <Card title="Classification Evidence Points">
                  <ul className="space-y-2 text-xs text-gray-300">
                    {result.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold">✓</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Spatial & Temporal Context */}
                <Card title="Geospatial & Temporal Context">
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-500 block font-semibold">Spatial Location & Matrix:</span>
                      <span className="text-gray-200">{result.spatial_context}</span>
                      <span className="block text-[10px] font-mono text-gray-400 mt-0.5">Coords: {result.coordinates}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-800">
                      <span className="text-gray-500 block font-semibold">Temporal Dynamics & Persistence:</span>
                      <span className="text-gray-200">{result.temporal_context}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card title="Classification Output">
              <div className="py-12 text-center text-gray-400 text-sm">
                <div className="text-3xl mb-2">🌡️</div>
                <p>Select a thermal scene or image and click <strong className="text-gray-200">"Run Thermal Classification"</strong> to extract features and generate prototype inference.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
