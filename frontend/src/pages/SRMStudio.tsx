import React, { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { fetchDemoScenes, uploadImage, runPreprocess, runSRM } from '../lib/api';

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

interface ProcessingMeta {
  steps?: string[];
  processing_time_s?: number;
  output_shape?: number[];
  pipeline?: string;
  model_type?: string;
  scale_factor?: number;
  input_shape?: number[];
  [key: string]: unknown;
}

/* ---- Before / After Comparison Slider ---- */
function ComparisonSlider({ beforeSrc, afterSrc, beforeLabel, afterLabel }: {
  beforeSrc: string; afterSrc: string; beforeLabel: string; afterLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) handleMove(e.clientX); };
    const onMouseUp = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => { if (dragging.current) handleMove(e.touches[0].clientX); };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [handleMove]);

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-w-[512px] mx-auto select-none cursor-col-resize overflow-hidden rounded-lg border border-gray-700">
      {/* After (full) */}
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 w-full h-full object-contain bg-gray-900" draggable={false} />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 w-full h-full object-contain bg-gray-900" style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} draggable={false} />
      </div>
      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-primary cursor-col-resize z-10"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={() => { dragging.current = true; }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-gray-900 font-bold text-xs shadow-lg">⇔</div>
      </div>
      {/* Labels */}
      <div className="absolute top-2 left-2 z-20"><Badge variant="neutral">{beforeLabel}</Badge></div>
      <div className="absolute top-2 right-2 z-20"><Badge variant="info">{afterLabel}</Badge></div>
    </div>
  );
}

/* ---- Zoomable Image ---- */
function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('center center');
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-700 cursor-zoom-in max-w-[512px]"
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto transition-transform duration-150"
        style={{ transform: zoomed ? 'scale(2.5)' : 'scale(1)', transformOrigin: origin }}
        draggable={false}
      />
    </div>
  );
}

/* ---- Main SRM Studio ---- */
export default function SRMStudio() {
  const [scenes, setScenes] = useState<DemoScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<DemoScene | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState(2);

  const [preprocessResult, setPreprocessResult] = useState<{ image_base64: string; original_base64: string; metadata: ProcessingMeta } | null>(null);
  const [srmResult, setSrmResult] = useState<{ original_base64: string; baseline_base64: string; enhanced_base64: string; disclaimer: string; preprocess_metadata: ProcessingMeta; srm_metadata: ProcessingMeta } | null>(null);

  const [loadingScenes, setLoadingScenes] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingPreprocess, setLoadingPreprocess] = useState(false);
  const [loadingSRM, setLoadingSRM] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch demo scenes on mount
  useEffect(() => {
    setLoadingScenes(true);
    fetchDemoScenes()
      .then((data) => setScenes(data.scenes || []))
      .catch((e) => setError(`Failed to load demo scenes: ${e.message}`))
      .finally(() => setLoadingScenes(false));
  }, []);

  const resetPipeline = () => {
    setPreprocessResult(null);
    setSrmResult(null);
    setError(null);
  };

  const handleSelectScene = (scene: DemoScene) => {
    resetPipeline();
    setSelectedScene(scene);
    setImageId(scene.id);
    setUploadedPreview(`http://localhost:8000${scene.image_path}`);
  };

  const handleFileUpload = async (file: File) => {
    resetPipeline();
    setSelectedScene(null);
    setLoadingUpload(true);
    setError(null);
    try {
      const data = await uploadImage(file);
      setImageId(data.id);
      // Create local preview
      const reader = new FileReader();
      reader.onload = (e) => setUploadedPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handlePreprocess = async () => {
    if (!imageId) return;
    setLoadingPreprocess(true);
    setError(null);
    try {
      const data = await runPreprocess(imageId);
      setPreprocessResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingPreprocess(false);
    }
  };

  const handleSRM = async () => {
    if (!imageId) return;
    setLoadingSRM(true);
    setError(null);
    try {
      const data = await runSRM(imageId, scaleFactor);
      setSrmResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingSRM(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SRM Studio</h2>
          <p className="text-sm text-gray-500">Super Resolution Mapping — Prototype Pipeline</p>
        </div>
        <Badge variant="warning">Prototype SRM Visualization</Badge>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 flex items-center justify-between">
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input */}
        <div className="space-y-4">
          {/* Upload */}
          <Card title="Upload Image">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-800/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff,.bmp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
              />
              <div className="text-3xl mb-2">📤</div>
              <p className="text-sm text-gray-400">{loadingUpload ? 'Uploading…' : 'Drop image or click to browse'}</p>
              <p className="text-xs text-gray-600 mt-1">PNG, JPG, TIFF, BMP (max 20 MB)</p>
            </div>
          </Card>

          {/* Demo Scenes */}
          <Card title="Demo Scenes">
            <p className="text-xs text-amber-400/80 mb-2">⚠ Prototype Demonstration Dataset</p>
            {loadingScenes ? (
              <p className="text-sm text-gray-500">Loading scenes…</p>
            ) : (
              <div className="space-y-2">
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSelectScene(scene)}
                    className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                      selectedScene?.id === scene.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-700 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{scene.title}</div>
                    <div className="text-xs text-gray-500">{scene.coordinates}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Scene Metadata */}
          {selectedScene && (
            <Card title="Scene Metadata">
              <dl className="space-y-1 text-sm">
                {([
                  ['ID', selectedScene.id],
                  ['Coordinates', selectedScene.coordinates],
                  ['Acquired', selectedScene.acquisition_date],
                  ['Source', selectedScene.source_type],
                  ['Thermal', selectedScene.thermal_info],
                  ['Hotspots', selectedScene.hotspots],
                  ['Land Context', selectedScene.land_context],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-gray-500 min-w-[80px]">{k}:</dt>
                    <dd className="text-gray-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>

        {/* Center Column: Preview + Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls */}
          {imageId && (
            <Card title="Pipeline Controls">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handlePreprocess} loading={loadingPreprocess} variant="secondary">
                  Run Preprocessing
                </Button>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Scale:</label>
                  <select
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(Number(e.target.value))}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  >
                    <option value={2}>2×</option>
                    <option value={4}>4×</option>
                  </select>
                </div>
                <Button onClick={handleSRM} loading={loadingSRM}>
                  Run SRM Pipeline
                </Button>
              </div>
            </Card>
          )}

          {/* Image Preview */}
          {uploadedPreview && !srmResult && (
            <Card title="Input Preview">
              <ZoomImage src={uploadedPreview} alt="Input" />
            </Card>
          )}

          {/* Preprocess Result */}
          {preprocessResult && !srmResult && (
            <Card title="Preprocessed Output">
              <ComparisonSlider
                beforeSrc={preprocessResult.original_base64}
                afterSrc={preprocessResult.image_base64}
                beforeLabel="Original"
                afterLabel="Preprocessed"
              />
              <div className="mt-3 text-xs text-gray-500">
                <p>Steps: {preprocessResult.metadata.steps?.join(' → ')}</p>
                <p>Time: {preprocessResult.metadata.processing_time_s}s</p>
              </div>
            </Card>
          )}

          {/* SRM Result */}
          {srmResult && (
            <div className="space-y-4">
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
                <p className="text-amber-300 text-xs">{srmResult.disclaimer}</p>
              </div>

              <Tabs tabs={[
                {
                  id: 'compare',
                  label: 'Before / After',
                  content: (
                    <ComparisonSlider
                      beforeSrc={srmResult.original_base64}
                      afterSrc={srmResult.enhanced_base64}
                      beforeLabel="Original"
                      afterLabel="SRM Enhanced"
                    />
                  ),
                },
                {
                  id: 'baseline',
                  label: 'Baseline Upscale',
                  content: (
                    <ComparisonSlider
                      beforeSrc={srmResult.baseline_base64}
                      afterSrc={srmResult.enhanced_base64}
                      beforeLabel="Bicubic Baseline"
                      afterLabel="SRM Enhanced"
                    />
                  ),
                },
                {
                  id: 'zoom',
                  label: 'Zoom Enhanced',
                  content: <ZoomImage src={srmResult.enhanced_base64} alt="SRM Enhanced" />,
                },
                {
                  id: 'metadata',
                  label: 'Processing Info',
                  content: (
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-1">Preprocess</h4>
                        <pre className="bg-gray-900 rounded p-3 text-xs text-gray-400 overflow-auto">{JSON.stringify(srmResult.preprocess_metadata, null, 2)}</pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-1">SRM Pipeline</h4>
                        <pre className="bg-gray-900 rounded p-3 text-xs text-gray-400 overflow-auto">{JSON.stringify(srmResult.srm_metadata, null, 2)}</pre>
                      </div>
                    </div>
                  ),
                },
              ]} />
            </div>
          )}

          {/* Empty state */}
          {!imageId && (
            <Card title="Getting Started" className="lg:col-span-2">
              <p className="text-gray-400 text-sm">Upload an image or select a demo scene to begin the SRM pipeline.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
