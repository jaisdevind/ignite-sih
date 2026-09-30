import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import MissionDashboard from './pages/MissionDashboard';
import SRMStudio from './pages/SRMStudio';
import ThermalIntelligence from './pages/ThermalIntelligence';
import GeospatialRiskMap from './pages/GeospatialRiskMap';
import IncidentAnalysis from './pages/IncidentAnalysis';
import ModelPipeline from './pages/ModelPipeline';
import About from './pages/About';

export default function App() {
  return (
    <Router>
      <div className="flex h-full bg-gray-900 text-gray-100">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-auto p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<MissionDashboard />} />
              <Route path="/srm-studio" element={<SRMStudio />} />
              <Route path="/thermal-intelligence" element={<ThermalIntelligence />} />
              <Route path="/geospatial-risk" element={<GeospatialRiskMap />} />
              <Route path="/incident-analysis" element={<IncidentAnalysis />} />
              <Route path="/model-pipeline" element={<ModelPipeline />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

