import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function About() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">About IGNITE</h2>
          <p className="text-sm text-gray-400 mt-1">
            Infrared Gradient Normalization & Intelligent Thermal Extraction System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">SIH 2026 Prototype</Badge>
          <Badge variant="neutral">SIH26142</Badge>
        </div>
      </div>

      {/* Identity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block">Problem Statement ID</span>
          <h3 className="text-lg font-bold text-primary font-mono mt-1">SIH26142</h3>
          <p className="text-xs text-gray-400 mt-1">Deep Learning Based Super Resolution Mapping (SRM) from Medium Resolution Satellite Imageries</p>
        </Card>

        <Card className="border-gray-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block">Theme & Category</span>
          <h3 className="text-lg font-bold text-gray-200 mt-1">Space Technology</h3>
          <p className="text-xs text-gray-400 mt-1">Software Category • Earth Observation & Remote Sensing</p>
        </Card>

        <Card className="border-gray-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block">Team Identity</span>
          <h3 className="text-lg font-bold text-amber-400 mt-1">Team IGNITE</h3>
          <p className="text-xs text-gray-400 mt-1">Smart India Hackathon 2026 Grand Finale Prototype</p>
        </Card>

        <Card className="border-gray-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block">System Architecture</span>
          <h3 className="text-lg font-bold text-emerald-400 mt-1">PyTorch + FastAPI + React</h3>
          <p className="text-xs text-gray-400 mt-1">Full-Stack Remote Sensing & GIS Processing Pipeline</p>
        </Card>
      </div>

      {/* Core Scientific Principles */}
      <Card title="Core Scientific Principles & System Axioms">
        <div className="space-y-4 text-xs text-gray-300">
          <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-1">
            <h4 className="font-bold text-sky-400">1. Radiometric Source of Truth</h4>
            <p className="text-gray-400">
              The original satellite thermal/radiometric measurements remain the immutable ground truth for all analytical decisions. Super-resolution mapping (SRM) layers serve as interpretability and visual detail enhancement overlays without overwriting raw sensor telemetry.
            </p>
          </div>

          <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-1">
            <h4 className="font-bold text-emerald-400">2. Explainable Anomaly Feature Extraction</h4>
            <p className="text-gray-400">
              Thermal anomaly classification uses explainable physical indicators including peak temperature ($K$), local thermal contrast ($+K$), hotspot area ($\%$), and circular compactness ratios ($4\pi A / P^2$) rather than opaque black-box inference.
            </p>
          </div>

          <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-1">
            <h4 className="font-bold text-amber-400">3. Multi-Factor Risk Assessment</h4>
            <p className="text-gray-400">
              The Prototype Risk Index combines thermal intensity ($35\%$), spatial footprint extent ($25\%$), target vulnerability ($20\%$), and infrastructure exposure buffer ($20\%$) into a transparent decision-support score.
            </p>
          </div>
        </div>
      </Card>

      {/* Technology Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Technology Stack Specifications">
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">Frontend Framework:</span>
              <span className="font-mono text-sky-400 font-bold">React 18 + TypeScript + Vite</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">Styling & UI Components:</span>
              <span className="font-mono text-sky-400 font-bold">Tailwind CSS (Dark Intelligence Theme)</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">GIS & Mapping Engine:</span>
              <span className="font-mono text-sky-400 font-bold">Leaflet + CartoDB Dark Matter</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">Backend API Framework:</span>
              <span className="font-mono text-emerald-400 font-bold">Python FastAPI (Async Uvicorn)</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">Image Processing:</span>
              <span className="font-mono text-emerald-400 font-bold">OpenCV + NumPy + PIL + SciPy</span>
            </li>
            <li className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
              <span className="text-gray-400">AI Model Framework:</span>
              <span className="font-mono text-emerald-400 font-bold">PyTorch (CPU-Friendly Modular Engine)</span>
            </li>
          </ul>
        </Card>

        {/* Prototype Disclosure & Research Disclaimers */}
        <Card title="Prototype & Demonstration Disclaimers">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-200 space-y-1">
              <h4 className="font-bold text-amber-300">SIH Jury Demonstration Notice</h4>
              <p className="text-amber-200/90 text-[11px] leading-relaxed">
                This software application is a functional prototype built for the Smart India Hackathon 2026 demonstration. All model outputs, super-resolved rasters, classification labels, and risk indices are labeled as prototype demonstration data.
              </p>
            </div>

            <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-400 space-y-1">
              <h4 className="font-bold text-gray-300">Model Status Classifications</h4>
              <p className="text-[11px] leading-relaxed">
                • <strong className="text-emerald-400">LIVE DEMO</strong>: Operational processing pipeline code.<br />
                • <strong className="text-sky-400">ARCHITECTURE MODULE</strong>: Defined PyTorch structural modules.<br />
                • <strong className="text-amber-400">FUTURE MODEL</strong>: Planned research roadmap models (Mamba SSM, PatchGAN).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
