import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fetchDemoScenes, uploadImage, runAnalyze } from '../lib/api';

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

const WORKFLOW_STEPS = [
  { id: 'data_received', label: 'DATA RECEIVED', icon: '📡' },
  { id: 'preprocessing', label: 'PREPROCESSING', icon: '🧹' },
  { id: 'srm', label: 'SRM RECONSTRUCTION', icon: '🔬' },
  { id: 'thermal_analysis', label: 'THERMAL ANALYSIS', icon: '🌡️' },
  { id: 'classification', label: 'CLASSIFICATION', icon: '🏷️' },
  { id: 'risk_assessment', label: 'RISK ASSESSMENT', icon: '🛡️' },
  { id: 'gis_context', label: 'GIS CONTEXT', icon: '🗺️' },
  { id: 'result_ready', label: 'RESULT READY', icon: '✨' },
];

export default function MissionDashboard() {
  const [scenes, setScenes] = useState<DemoScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<DemoScene | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(2);

  // Workflow Step Animation State
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Results State
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoScenes()
      .then((data) => {
        const sc = data.scenes || [];
        setScenes(sc);
        if (sc.length > 0) {
          setSelectedScene(sc[0]);
          setImageId(sc[0].id);
        }
      })
      .catch((e) => setError(`Failed to load demo scenes: ${e.message}`));
  }, []);

  const handleSelectScene = (sc: DemoScene) => {
    setSelectedScene(sc);
    setImageId(sc.id);
    setAnalysisResult(null);
    setCompletedSteps([]);
    setActiveStepIndex(-1);
    setError(null);
  };

  const handleFileUpload = async (file: File) => {
    setSelectedScene(null);
    setAnalysisResult(null);
    setCompletedSteps([]);
    setActiveStepIndex(-1);
    setError(null);
    try {
      const data = await uploadImage(file);
      setImageId(data.id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const startDemonstrationWorkflow = async () => {
    if (!imageId) return;
    setIsRunning(true);
    setCompletedSteps([]);
    setActiveStepIndex(0);
    setError(null);
    setAnalysisResult(null);

    // Step-by-step progress animation simulation
    for (let i = 0; i < WORKFLOW_STEPS.length - 1; i++) {
      setActiveStepIndex(i);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setCompletedSteps((prev) => [...prev, WORKFLOW_STEPS[i].id]);
    }

    // Call unified analysis backend
    try {
      const result = await runAnalyze(imageId, scaleFactor, selectedScene?.land_context || '', 'High');
      setAnalysisResult(result);
      // Mark final step completed
      setActiveStepIndex(WORKFLOW_STEPS.length - 1);
      setCompletedSteps((prev) => [...prev, WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1].id]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const exportJSON = () => {
    if (!analysisResult) return;
    const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IGNITE_Analysis_${analysisResult.image_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPDFReport = () => {
    if (!imageId) return;
    window.open(`http://localhost:8000/api/report-html/${encodeURIComponent(imageId)}`, '_blank');
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL RISK</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HIGH RISK</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">MEDIUM RISK</Badge>;
      default:
        return <Badge variant="success">LOW RISK</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* SIH Master Banner */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-xs font-mono tracking-widest text-primary font-bold uppercase">
                Smart India Hackathon 2026 • SIH26142
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-100 tracking-tight">
              IGNITE — Infrared Gradient Normalization & Intelligent Thermal Extraction
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-3xl">
              Deep Learning Based Super Resolution Mapping (SRM) from Medium Resolution Satellite Imageries for Space Technology Application.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant="warning">Theme: Space Technology</Badge>
            <Badge variant="neutral font-mono">Team IGNITE</Badge>
          </div>
        </div>
      </div>

      {/* 1. INPUT SELECTION & WORKFLOW CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Step 1: Input Scene Selection">
          <div className="space-y-3">
            <label className="text-xs text-gray-400 block font-semibold">Select Demonstration Scene:</label>
            <div className="space-y-2">
              {scenes.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScene(sc)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    selectedScene?.id === sc.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-gray-800 hover:border-gray-700 text-gray-300 bg-gray-900/30'
                  }`}
                >
                  <div className="font-bold">{sc.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{sc.coordinates}</div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-800">
              <label className="text-xs text-gray-400 block font-semibold mb-1">Or Upload Custom Thermal File:</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700"
              />
            </div>
          </div>
        </Card>

        {/* Pipeline Controls & Execution */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Step 2: Demonstration Workflow Configuration">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400">SRM Scale Factor:</label>
                <select
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-gray-200"
                >
                  <option value={2}>2× Spatial Upscale</option>
                  <option value={4}>4× Spatial Upscale</option>
                </select>
              </div>

              <Button
                onClick={startDemonstrationWorkflow}
                loading={isRunning}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
              >
                🚀 RUN COMPLETE SIH WORKFLOW
              </Button>
            </div>
          </Card>

          {/* 2. BEAUTIFUL ANIMATED PROGRESS PIPELINE */}
          <Card title="Demonstration Workflow Execution Sequence">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isDone = completedSteps.includes(step.id);
                const isCurrent = activeStepIndex === idx && isRunning;
                return (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border text-center transition-all duration-300 flex flex-col justify-between h-20 ${
                      isDone
                        ? 'border-emerald-600/80 bg-emerald-950/30 text-emerald-300'
                        : isCurrent
                        ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(14,165,233,0.5)] animate-pulse'
                        : 'border-gray-800 bg-gray-950/40 text-gray-500'
                    }`}
                  >
                    <div className="text-base">{step.icon}</div>
                    <div className="text-[9px] font-bold tracking-tight line-clamp-1">{step.label}</div>
                    <div className="text-[10px] font-mono">
                      {isDone ? '✓ DONE' : isCurrent ? '⏳ IN PROGRESS' : 'WAITING'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* 3. FINAL COMPREHENSIVE INCIDENT RESULT DISPLAY */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Badge variant="success">Workflow Complete</Badge>
              <span className="text-xs text-gray-400 font-mono">Incident ID: {analysisResult.image_id}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={exportJSON} variant="secondary">
                📄 Export Analysis (JSON)
              </Button>
              <Button onClick={openPDFReport}>
                🖨️ Export PDF Report
              </Button>
            </div>
          </div>

          {/* Unified Incident Overview Header */}
          <Card className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Anomaly Classification</span>
                <h3 className="text-xl font-bold text-gray-100 mt-0.5">{analysisResult.classification.name}</h3>
                <span className="text-xs text-sky-400 font-mono">
                  {Math.round(analysisResult.classification.prototype_confidence * 100)}% Confidence
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Prototype Risk Index</span>
                <div className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
                  {analysisResult.risk.risk_index} / 100
                </div>
                <div>{getRiskBadge(analysisResult.risk.risk_level)}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Radiometric Intensity</span>
                <div className="text-xl font-bold text-red-400 font-mono mt-0.5">
                  {analysisResult.classification.extracted_features.max_temp_k} K
                </div>
                <span className="text-xs text-gray-400">
                  +{analysisResult.classification.extracted_features.local_contrast_k} K Local Delta
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Geospatial Coordinates</span>
                <div className="text-sm font-mono font-bold text-gray-200 mt-1">
                  {analysisResult.classification.coordinates}
                </div>
                <span className="text-[11px] text-gray-400 line-clamp-1">
                  {analysisResult.classification.spatial_context}
                </span>
              </div>
            </div>
          </Card>

          {/* Rasters Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Original Thermal Satellite Input">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                <img src={analysisResult.srm.original_base64} alt="Original" className="w-full h-full object-contain" />
              </div>
            </Card>

            <Card title="Super-Resolution Mapping (SRM) Reconstruction">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                <img src={analysisResult.srm.enhanced_base64} alt="SRM Enhanced" className="w-full h-full object-contain" />
              </div>
            </Card>
          </div>

          {/* Risk Factors Breakdown Charts & Evidence Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Explainable Risk Factor Breakdown Chart">
              <div className="space-y-3">
                {analysisResult.risk.contributing_factors.map((f: any, idx: number) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-200">{f.factor} ({f.weight_pct}% Weight)</span>
                      <span className="font-mono text-sky-400">+{f.contribution_points} pts</span>
                    </div>
                    <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                      <div className="h-full bg-primary" style={{ width: `${f.score}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Diagnostic Evidence & Decision Support Log">
              <ul className="space-y-2 text-xs text-gray-300">
                {analysisResult.evidence.map((ev: string, idx: number) => (
                  <li key={idx} className="p-2 rounded bg-gray-950 border border-gray-800 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
