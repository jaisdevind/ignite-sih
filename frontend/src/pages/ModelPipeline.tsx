import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import { fetchModelPipelineInfo } from '../lib/api';

type StatusType = 'LIVE DEMO' | 'ARCHITECTURE MODULE' | 'FUTURE MODEL';

interface PipelineNode {
  id: string;
  name: string;
  short_code: string;
  status: StatusType;
  category: 'input' | 'preprocessing' | 'backbone' | 'attention' | 'fusion' | 'sequence' | 'reconstruction' | 'discriminator' | 'analytics';
  description: string;
  role: string;
  math_spec: string;
  input_dim: string;
  output_dim: string;
  code_snippet: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: 'satellite_data',
    name: 'Satellite Data',
    short_code: 'SAT-IN',
    status: 'LIVE DEMO',
    category: 'input',
    description: 'Ingestion of Medium Resolution Satellite Imagery (Landsat-8 TIRS, Sentinel-2 SWIR, PlanetScope).',
    role: 'Primary thermal/radiometric source of truth containing low spatial resolution band measurements.',
    math_spec: 'I_{LR} \\in \\mathbb{R}^{H \\times W \\times C}, \\quad C \\in \\text{\\{Thermal, SWIR, RGB\\}}',
    input_dim: 'Raster GeoTIFF / PNG (e.g. 128x128)',
    output_dim: '3-Channel Normalized Radiometric Matrix',
    code_snippet: `def load_satellite_raster(file_bytes):\n    img = Image.open(io.BytesIO(file_bytes))\n    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)`
  },
  {
    id: 'qa_preprocess',
    name: 'QA / Preprocessing',
    short_code: 'QA-PRE',
    status: 'LIVE DEMO',
    category: 'preprocessing',
    description: 'Automated image validation, cloud masking, outlier filtering, and bilateral noise removal.',
    role: 'Removes atmospheric degradation while preserving sharp thermal gradient boundaries.',
    math_spec: 'I_{denoised}(x) = \\frac{1}{W_p} \\sum_{x_i \\in \\Omega} I(x_i) g_r(\\|I(x_i) - I(x)\\|) g_s(\\|x_i - x\\|)',
    input_dim: 'Raw Satellite Matrix',
    output_dim: 'Denoised Matrix [H, W, 3]',
    code_snippet: `def denoise(img):\n    # Bilateral filter preserves sharp thermal edges\n    return cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)`
  },
  {
    id: 'clahe_dwt',
    name: 'CLAHE / DWT',
    short_code: 'CONT-DWT',
    status: 'LIVE DEMO',
    category: 'preprocessing',
    description: 'Contrast Limited Adaptive Histogram Equalization & Discrete Wavelet Transform channel separation.',
    role: 'Amplifies localized thermal contrast across micro-climates without saturating hot zones.',
    math_spec: 'g = \\left( \\frac{g_{max} - g_{min}}{M} \\right) \\cdot T(f) + g_{min}',
    input_dim: 'Denoised Matrix',
    output_dim: 'Enhanced Radiometric Channels',
    code_snippet: `def enhance_contrast(img):\n    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)\n    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))\n    lab[:,:,0] = clahe.apply(lab[:,:,0])\n    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)`
  },
  {
    id: 'feature_extraction',
    name: 'Feature Extraction',
    short_code: 'FEAT-EX',
    status: 'ARCHITECTURE MODULE',
    category: 'backbone',
    description: 'Multi-scale spatial-radiometric feature extraction block mapping pixel intensities to feature space.',
    role: 'Converts preprocessed thermal arrays into rich multi-channel feature representations.',
    math_spec: 'F_0 = \\sigma(\\text{Conv}_{3\\times 3}(I_{prep})) \\in \\mathbb{R}^{H \\times W \\times C_{feat}}',
    input_dim: '[B, 3, H, W]',
    output_dim: '[B, 64, H, W]',
    code_snippet: `class FeatureExtractor(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.conv = nn.Conv2d(3, 64, kernel_size=3, padding=1)\n        self.relu = nn.ReLU(inplace=True)`
  },
  {
    id: 'efficientnet_b3',
    name: 'EfficientNet-B3',
    short_code: 'EFF-B3',
    status: 'ARCHITECTURE MODULE',
    category: 'backbone',
    description: 'Compound scaled MBConv backbone for deep semantic feature extraction across spatial scales.',
    role: 'Extracts deep hierarchical features ranging from local thermal boundaries to broad landscape patterns.',
    math_spec: '\\text{Depth: } d = \\alpha^0.7, \\quad \\text{Width: } w = \\beta^0.7, \\quad \\text{Res: } r = \\gamma^0.7',
    input_dim: '[B, 64, H, W]',
    output_dim: 'Multi-scale Pyramidal Features {P2, P3, P4, P5}',
    code_snippet: `class EfficientNetB3Backbone(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.stem = nn.Sequential(nn.Conv2d(3, 40, 3, stride=2, padding=1), nn.SiLU())\n        # MBConv blocks with squeeze-and-excitation`
  },
  {
    id: 'cbam',
    name: 'CBAM',
    short_code: 'CBAM-ATT',
    status: 'ARCHITECTURE MODULE',
    category: 'attention',
    description: 'Convolutional Block Attention Module performing sequential Channel and Spatial Attention.',
    role: 'Focuses feature weights on critical thermal anomaly bands and sharp spatial hotspot boundaries.',
    math_spec: 'M_c(F) = \\sigma(MLP(AvgPool(F)) + MLP(MaxPool(F))), \\quad M_s(F\') = \\sigma(f^{7\\times 7}([AvgPool(F\'); MaxPool(F\')]))',
    input_dim: '[B, C, H, W]',
    output_dim: 'Attention-Weighted Feature Map [B, C, H, W]',
    code_snippet: `class CBAMModule(nn.Module):\n    def forward(self, x):\n        x = self.channel_attention(x) * x\n        x = self.spatial_attention(x) * x\n        return x`
  },
  {
    id: 'bifpn',
    name: 'BiFPN',
    short_code: 'BiFPN-FUS',
    status: 'ARCHITECTURE MODULE',
    category: 'fusion',
    description: 'Bidirectional Feature Pyramid Network with learnable fast normalized fusion weights.',
    role: 'Fuses high-level semantic land context with low-level high-resolution thermal edge features.',
    math_spec: 'O = \\sum_i \\frac{w_i}{\\epsilon + \\sum_j w_j} \\cdot I_i, \\quad w_i \\ge 0',
    input_dim: 'Pyramid Features {P3, P4, P5}',
    output_dim: 'Fused Multi-Scale Feature Map',
    code_snippet: `class BiFPNLayer(nn.Module):\n    def forward(self, p_high, p_low):\n        w = F.relu(self.weights)\n        norm_w = w / (torch.sum(w) + 1e-4)\n        return F.relu(self.conv(norm_w[0]*p_low + norm_w[1]*upsample(p_high)))`
  },
  {
    id: 'mamba_ssm',
    name: 'Mamba SSM',
    short_code: 'MAMBA-SSM',
    status: 'FUTURE MODEL',
    category: 'sequence',
    description: 'Selective State Space Model for linear time O(N) long-range spatial thermal dependency modeling.',
    role: 'Captures global thermal gradient continuity across wide-swath satellite scenes without O(N^2) memory bottleneck.',
    math_spec: 'h\'(t) = A h(t) + B x(t), \\quad y(t) = C h(t) + D x(t), \\quad \\text{Selective parameterization } (B, C, \\Delta)',
    input_dim: 'Flattened Spatial Feature Sequences [B, N, D]',
    output_dim: 'Global Context Enhanced Sequences [B, N, D]',
    code_snippet: `class MambaSelectiveSSM(nn.Module):\n    # Planned Phase 3 Integration\n    # Selective state-space scan across spatial directions`
  },
  {
    id: 'srm_reconstruction',
    name: 'SRM Reconstruction',
    short_code: 'SRM-REC',
    status: 'LIVE DEMO',
    category: 'reconstruction',
    description: 'Super-Resolution Mapping reconstruction head generating high-resolution spatial thermal maps.',
    role: 'Upscales low-resolution pixels while sharpening local detail and suppressing blur artifacts.',
    math_spec: 'I_{SR} = \\mathcal{H}_{SRM}(F_{fused}) \\in \\mathbb{R}^{sH \\times sW \\times C}, \\quad s \\in \\{2, 4\\}',
    input_dim: 'Enhanced Feature Map',
    output_dim: 'Super-Resolved Output Image [sH, sW, 3]',
    code_snippet: `def srm_prototype(img, scale_factor=2):\n    baseline = cv2.resize(img, (w*scale_factor, h*scale_factor), interpolation=cv2.INTER_CUBIC)\n    edges = enhance_edges(baseline, strength=0.5)\n    return enhance_contrast(edges)`
  },
  {
    id: 'patchgan',
    name: 'PatchGAN',
    short_code: 'PATCH-GAN',
    status: 'FUTURE MODEL',
    category: 'discriminator',
    description: '70x70 PatchGAN Adversarial Discriminator evaluating local high-frequency realism.',
    role: 'Supervises super-resolution reconstruction to enforce realistic sub-pixel thermal texture.',
    math_spec: '\\mathcal{L}_{GAN}(G, D) = \\mathbb{E}_{x}[\\log D(x)] + \\mathbb{E}_{y}[\\log(1 - D(G(y)))]',
    input_dim: 'SR Output Image Patches [70x70]',
    output_dim: 'Patch Realism Probability Matrix',
    code_snippet: `class PatchGANDiscriminator(nn.Module):\n    # Planned Phase 3 Adversarial Training\n    # 70x70 patch-level realism loss supervision`
  },
  {
    id: 'thermal_intel',
    name: 'Thermal Intelligence',
    short_code: 'TH-INTEL',
    status: 'LIVE DEMO',
    category: 'analytics',
    description: 'Thermal anomaly detection, hotspot extraction, and temperature range calibration module.',
    role: 'Extracts quantitative thermal indicators (max K, hotspot clusters, gradient intensity).',
    math_spec: 'T_{calibrated} = K_1 / \\ln(K_2 / L_\\lambda + 1), \\quad \\text{Hotspot Mask } M_{hot} = (T > T_{thresh})',
    input_dim: 'Super-Resolved Thermal Map',
    output_dim: 'Hotspot Bounding Boxes & Thermal Metrics',
    code_snippet: `def extract_thermal_hotspots(thermal_map, threshold=315):\n    hot_mask = thermal_map > threshold\n    contours, _ = cv2.findContours(hot_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\n    return contours`
  },
  {
    id: 'risk_engine',
    name: 'Risk Engine',
    short_code: 'RISK-ENG',
    status: 'LIVE DEMO',
    category: 'analytics',
    description: 'Geospatial risk assessment engine combining thermal hotspots with land-use vulnerability context.',
    role: 'Generates actionable thermal risk overlays (Low, Moderate, High, Severe Risk).',
    math_spec: '\\text{RiskScore} = w_t \\cdot T_{norm} + w_l \\cdot V_{landuse} + w_g \\cdot \\|\\nabla T\\|',
    input_dim: 'Thermal Hotspots + Land Use Vector',
    output_dim: 'Geospatial Thermal Risk Overlay Map',
    code_snippet: `def compute_risk_score(temp_k, land_vulnerability):\n    norm_temp = min(1.0, max(0.0, (temp_k - 280) / 45.0))\n    return 0.6 * norm_temp + 0.4 * land_vulnerability`
  }
];

export default function ModelPipeline() {
  const [selectedNode, setSelectedNode] = useState<PipelineNode>(PIPELINE_NODES[4]); // Default to EfficientNet-B3
  const [backendEngines, setBackendEngines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchModelPipelineInfo()
      .then((data) => {
        if (data.engines) setBackendEngines(data.engines);
      })
      .catch((err) => console.warn('Backend model info offline fallback:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'LIVE DEMO':
        return <Badge variant="success">LIVE DEMO</Badge>;
      case 'ARCHITECTURE MODULE':
        return <Badge variant="info">ARCHITECTURE MODULE</Badge>;
      case 'FUTURE MODEL':
        return <Badge variant="warning">FUTURE MODEL</Badge>;
    }
  };

  const getStatusBorderColor = (status: StatusType, isSelected: boolean) => {
    if (isSelected) return 'border-primary shadow-[0_0_15px_rgba(14,165,233,0.5)] bg-primary/10';
    switch (status) {
      case 'LIVE DEMO':
        return 'border-emerald-700/80 hover:border-emerald-400 bg-emerald-950/20';
      case 'ARCHITECTURE MODULE':
        return 'border-sky-700/80 hover:border-sky-400 bg-sky-950/20';
      case 'FUTURE MODEL':
        return 'border-amber-700/80 hover:border-amber-400 bg-amber-950/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Architecture & Model Pipeline</h2>
          <p className="text-sm text-gray-400 mt-1">
            Modular Deep Learning Super-Resolution Mapping (SRM) & Thermal Extraction Architecture
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">SIH Jury Architecture Spec</Badge>
          <Badge variant="neutral">SIH26142</Badge>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
        <div className="text-amber-400 text-xl font-bold">⚠️</div>
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-300">Hackathon Prototype Disclosure: </span>
          Components in this pipeline are explicitly classified into three tiers:
          <span className="font-semibold text-emerald-300"> LIVE DEMO</span> (active operational pipeline code),
          <span className="font-semibold text-sky-300"> ARCHITECTURE MODULE</span> (defined PyTorch modular code structures), and
          <span className="font-semibold text-amber-300"> FUTURE MODEL</span> (planned research roadmap models).
          Future models are structural representations and are not claimed as pre-trained network weights in this prototype.
        </div>
      </div>

      {/* 1. VISUAL PIPELINE FLOW DIAGRAM */}
      <Card title="Super-Resolution Mapping (SRM) End-to-End Pipeline Diagram">
        <p className="text-xs text-gray-400 mb-4">
          Click any component node below to inspect its mathematical specification, input/output tensors, execution status, and code implementation.
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs bg-gray-900/60 p-3 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-gray-300 font-medium">LIVE DEMO (Active Prototype Pipeline)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"></span>
            <span className="text-gray-300 font-medium">ARCHITECTURE MODULE (PyTorch Code Defined)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
            <span className="text-gray-300 font-medium">FUTURE MODEL (Research Roadmap Integration)</span>
          </div>
        </div>

        {/* Flow Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {PIPELINE_NODES.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            return (
              <div key={node.id} className="relative group">
                <button
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between h-32 ${getStatusBorderColor(
                    node.status,
                    isSelected
                  )}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-gray-400">Step {index + 1}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-900/80 text-gray-300 border border-gray-700">
                      {node.short_code}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-100 line-clamp-1">{node.name}</h4>
                    <p className="text-[10px] text-gray-400 capitalize mt-0.5">{node.category}</p>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    {getStatusBadge(node.status)}
                    <span className="text-xs text-primary group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. COMPONENT DETAIL INSPECTOR PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detailed Spec Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card title={`Component Spec: ${selectedNode.name}`}>
            <div className="space-y-4">
              {/* Header bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-primary font-bold">[{selectedNode.short_code}]</span>
                  <h3 className="text-lg font-bold text-gray-100">{selectedNode.name}</h3>
                </div>
                <div>{getStatusBadge(selectedNode.status)}</div>
              </div>

              {/* Functional Role & Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Functional Description & Purpose</h4>
                <p className="text-sm text-gray-200">{selectedNode.description}</p>
                <p className="text-xs text-gray-400 mt-1 italic">{selectedNode.role}</p>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-900/80 p-3 rounded-lg border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-500 block">Input Format / Dimension:</span>
                  <span className="font-mono text-sky-300 font-semibold">{selectedNode.input_dim}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Output Format / Dimension:</span>
                  <span className="font-mono text-emerald-300 font-semibold">{selectedNode.output_dim}</span>
                </div>
              </div>

              {/* Math Spec */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Mathematical / Architectural Formulation</h4>
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs font-mono text-amber-300 overflow-x-auto">
                  {selectedNode.math_spec}
                </div>
              </div>

              {/* Code Snippet */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Implementation Code / Interface Definition</h4>
                <pre className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                  {selectedNode.code_snippet}
                </pre>
              </div>
            </div>
          </Card>
        </div>

        {/* Backend Model Engine Status Matrix */}
        <div className="space-y-4">
          <Card title="Registered Model Engines">
            <p className="text-xs text-gray-400 mb-3">
              Live status pings from backend engine registry (`BaseModelEngine` hierarchy):
            </p>

            <div className="space-y-3">
              {backendEngines.length === 0 ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-200">DemoSRMEngine</span>
                      <Badge variant="success">LIVE DEMO</Badge>
                    </div>
                    <p className="text-gray-400 text-[11px]">Active high-speed deterministic OpenCV/NumPy baseline.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-sky-800/60 bg-sky-950/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-200">CNNFeatureEngine</span>
                      <Badge variant="info">ARCHITECTURE MODULE</Badge>
                    </div>
                    <p className="text-gray-400 text-[11px]">PyTorch EfficientNet-B3 + CBAM module definitions.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-800/60 bg-amber-950/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-200">FutureMambaEngine</span>
                      <Badge variant="warning">FUTURE MODEL</Badge>
                    </div>
                    <p className="text-gray-400 text-[11px]">State Space Model (SSM) spatial context roadmap.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-800/60 bg-amber-950/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-200">FuturePatchGANEngine</span>
                      <Badge variant="warning">FUTURE MODEL</Badge>
                    </div>
                    <p className="text-gray-400 text-[11px]">PatchGAN discriminator loss supervision roadmap.</p>
                  </div>
                </div>
              ) : (
                backendEngines.map((engine, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-gray-700 bg-gray-900/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-200">{engine.name}</span>
                      {getStatusBadge(engine.status as StatusType)}
                    </div>
                    <p className="text-gray-400 text-[11px]">{engine.description}</p>
                    {engine.backend && (
                      <p className="text-[10px] text-sky-400 font-mono">Backend: {engine.backend}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
