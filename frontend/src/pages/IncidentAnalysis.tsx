import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fetchDemoScenes, runAnalyze } from '../lib/api';

export default function IncidentAnalysis() {
  const [scenes, setScenes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('industrial-001');
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoScenes()
      .then((data) => {
        const sc = data.scenes || [];
        setScenes(sc);
        if (sc.length > 0) {
          fetchIncident(sc[0].id);
        }
      })
      .catch((e) => setError(`Failed to fetch scenes: ${e.message}`));
  }, []);

  const fetchIncident = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await runAnalyze(id, 2, '', 'High');
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IGNITE_Incident_Report_${analysis.image_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thermal Incident Analysis Dossier</h2>
          <p className="text-sm text-gray-400 mt-1">
            Unified Multi-Stage Incident Diagnostic (SRM + Thermal Classifier + Risk Engine)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">Unified Analysis</Badge>
          <Button onClick={downloadReport} disabled={!analysis} variant="secondary">
            📥 Export Dossier JSON
          </Button>
        </div>
      </div>

      {/* Incident Selection */}
      <Card title="Select Incident Case Study">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedId(s.id);
                fetchIncident(s.id);
              }}
              className={`p-3 rounded-xl border text-left transition-colors ${
                selectedId === s.id
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-gray-800 hover:border-gray-700 text-gray-300 bg-gray-900/30'
              }`}
            >
              <div className="font-bold text-sm">{s.title}</div>
              <div className="text-xs text-gray-500 mt-1">{s.coordinates}</div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">{s.source_type}</div>
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Incident Overview Card */}
          <Card className="bg-gradient-to-r from-gray-900 via-gray-850 to-gray-900 border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-gray-400">Incident Classification</span>
                <h3 className="text-xl font-bold text-gray-100 mt-1">{analysis.classification.name}</h3>
                <span className="text-xs text-sky-400 font-mono">
                  {Math.round(analysis.classification.prototype_confidence * 100)}% Confidence
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-gray-400">Prototype Risk Index</span>
                <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                  {analysis.risk.risk_index} / 100
                </div>
                <Badge variant={analysis.risk.risk_level === 'CRITICAL' ? 'danger' : 'warning'}>
                  {analysis.risk.risk_level}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-gray-400">Peak Thermal Intensity</span>
                <div className="text-xl font-bold text-red-400 font-mono mt-1">
                  {analysis.classification.extracted_features.max_temp_k} K
                </div>
                <span className="text-xs text-gray-400">
                  +{analysis.classification.extracted_features.local_contrast_k} K Local Contrast
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-gray-400">Geospatial Coords</span>
                <div className="text-sm font-bold text-gray-200 mt-1 font-mono">
                  {analysis.classification.coordinates}
                </div>
                <span className="text-[11px] text-gray-400 line-clamp-1">
                  {analysis.classification.spatial_context}
                </span>
              </div>
            </div>
          </Card>

          {/* SRM Visual Transformation Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Original Thermal Satellite Input">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                <img
                  src={analysis.srm.original_base64}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>

            <Card title="Super-Resolution Mapping (SRM) Output">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                <img
                  src={analysis.srm.enhanced_base64}
                  alt="SRM Enhanced"
                  className="w-full h-full object-contain"
                />
              </div>
            </Card>
          </div>

          {/* Unified Diagnostic Evidence Log */}
          <Card title="Unified Diagnostic Evidence & Forensic Log">
            <div className="space-y-2 text-xs">
              {analysis.evidence.map((ev: string, idx: number) => (
                <div key={idx} className="p-2 rounded bg-gray-950 border border-gray-800 text-gray-300 flex items-start gap-2">
                  <span className="text-primary font-bold">[{idx + 1}]</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
