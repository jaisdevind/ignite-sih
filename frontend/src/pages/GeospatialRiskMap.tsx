import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polygon, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { fetchGeoJSONLayers, runAnalyze } from '../lib/api';

// Helper component to center and pan map smoothly when selected incident changes
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface HotspotProps {
  incident_id: string;
  title: string;
  classification: string;
  temp_k: number;
  frp_mw: number;
  risk_index: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  persistence: string;
  infrastructure: string;
  evidence: string[];
}

export default function GeospatialRiskMap() {
  const [layersData, setLayersData] = useState<any | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    hotspots: true,
    industrial: true,
    forest: true,
    agri: true,
    infrastructure: true,
    riskCircles: true,
  });

  const [selectedIncident, setSelectedIncident] = useState<HotspotProps | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default Delhi Industrial
  const [mapZoom, setMapZoom] = useState<number>(7);

  const [detailedAnalysis, setDetailedAnalysis] = useState<any | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGeoJSONLayers()
      .then((data) => {
        setLayersData(data);
        if (data.hotspots?.features?.length > 0) {
          const firstProp = data.hotspots.features[0].properties;
          handleSelectHotspot(firstProp, [data.hotspots.features[0].geometry.coordinates[1], data.hotspots.features[0].geometry.coordinates[0]]);
        }
      })
      .catch((err) => setError(`Failed to load GeoJSON demo layers: ${err.message}`));
  }, []);

  const handleSelectHotspot = (props: HotspotProps, latlng: [number, number]) => {
    setSelectedIncident(props);
    setMapCenter(latlng);
    setMapZoom(9);
    // Fetch live unified analysis for this incident
    if (props.incident_id) {
      setLoadingAnalysis(true);
      runAnalyze(props.incident_id, 2, '', 'High')
        .then((res) => setDetailedAnalysis(res))
        .catch((e) => console.warn('Analysis fetch error:', e))
        .finally(() => setLoadingAnalysis(false));
    }
  };

  const getMarkerColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#ef4444'; // Red
      case 'HIGH':
        return '#f97316'; // Orange
      case 'MEDIUM':
        return '#eab308'; // Yellow
      default:
        return '#10b981'; // Green
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Geospatial Thermal Intelligence Map</h2>
          <p className="text-sm text-gray-400 mt-1">
            Interactive Multi-Layered GIS Viewer for Satellite Thermal Risk Extraction & Asset Proximity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning">Demo Geospatial Layer</Badge>
          <Badge variant="neutral">SIH Prototype</Badge>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <span className="text-lg">🗺️</span>
        <div>
          <span className="font-semibold text-amber-300">Geospatial Data Disclosure: </span>
          All map coordinates, thermal hotspot vectors, and infrastructure boundaries are simulated demonstration datasets for hackathon prototype evaluation.
          They do <strong className="text-white">NOT</strong> represent live government surveillance feeds or active emergency deployments.
        </div>
      </div>

      {/* Layer Toggles Toolbar */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="font-bold text-gray-300 uppercase tracking-wider">GIS Demo Layers:</span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.hotspots}
                onChange={(e) => setActiveLayers({ ...activeLayers, hotspots: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-red-400">🔥 Hotspots</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.riskCircles}
                onChange={(e) => setActiveLayers({ ...activeLayers, riskCircles: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-amber-400">⭕ Risk Zones</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.industrial}
                onChange={(e) => setActiveLayers({ ...activeLayers, industrial: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-sky-400">🏭 Industrial Zones</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.forest}
                onChange={(e) => setActiveLayers({ ...activeLayers, forest: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-emerald-400">🌲 Forest Reserves</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.agri}
                onChange={(e) => setActiveLayers({ ...activeLayers, agri: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-yellow-400">🌾 Agriculture</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                checked={activeLayers.infrastructure}
                onChange={(e) => setActiveLayers({ ...activeLayers, infrastructure: e.target.checked })}
                className="rounded text-primary focus:ring-0"
              />
              <span className="text-purple-400">⚡ Infrastructure</span>
            </label>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Main Map + Selected Incident Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative h-[550px] rounded-xl overflow-hidden border border-gray-800 shadow-2xl z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
            >
              <MapViewController center={mapCenter} zoom={mapZoom} />

              {/* CartoDB Dark Matter Tiles */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* GeoJSON Layers Rendering */}
              {layersData && (
                <>
                  {/* Industrial Zones Polygons */}
                  {activeLayers.industrial &&
                    layersData.industrial_zones?.features?.map((feat: any, idx: number) => {
                      const positions = feat.geometry.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
                      return (
                        <Polygon
                          key={`ind-${idx}`}
                          positions={positions}
                          pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15, weight: 1.5 }}
                        >
                          <Popup>
                            <div className="text-xs">
                              <strong>{feat.properties.name}</strong>
                              <p className="text-[10px] text-gray-500">{feat.properties.zone_type}</p>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    })}

                  {/* Forest Regions Polygons */}
                  {activeLayers.forest &&
                    layersData.forest_regions?.features?.map((feat: any, idx: number) => {
                      const positions = feat.geometry.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
                      return (
                        <Polygon
                          key={`for-${idx}`}
                          positions={positions}
                          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 1.5 }}
                        >
                          <Popup>
                            <div className="text-xs">
                              <strong>{feat.properties.name}</strong>
                              <p className="text-[10px] text-gray-500">{feat.properties.zone_type}</p>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    })}

                  {/* Agricultural Regions Polygons */}
                  {activeLayers.agri &&
                    layersData.agricultural_regions?.features?.map((feat: any, idx: number) => {
                      const positions = feat.geometry.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
                      return (
                        <Polygon
                          key={`agr-${idx}`}
                          positions={positions}
                          pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.15, weight: 1.5 }}
                        >
                          <Popup>
                            <div className="text-xs">
                              <strong>{feat.properties.name}</strong>
                              <p className="text-[10px] text-gray-500">{feat.properties.zone_type}</p>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    })}

                  {/* Infrastructure Lines */}
                  {activeLayers.infrastructure &&
                    layersData.infrastructure?.features?.map((feat: any, idx: number) => {
                      const positions = feat.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
                      return (
                        <Polyline
                          key={`inf-${idx}`}
                          positions={positions}
                          pathOptions={{ color: '#a855f7', weight: 3, dashArray: '6, 6' }}
                        >
                          <Popup>
                            <div className="text-xs">
                              <strong>{feat.properties.name}</strong>
                              <p className="text-[10px] text-gray-500">Infrastructure Type: {feat.properties.type}</p>
                            </div>
                          </Popup>
                        </Polyline>
                      );
                    })}

                  {/* Risk Circles */}
                  {activeLayers.riskCircles &&
                    layersData.risk_zones?.features?.map((feat: any, idx: number) => {
                      const latlng: [number, number] = [feat.geometry.coordinates[1], feat.geometry.coordinates[0]];
                      const radiusMeters = (feat.properties.radius_km || 1.0) * 1000;
                      return (
                        <Circle
                          key={`risk-${idx}`}
                          center={latlng}
                          radius={radiusMeters}
                          pathOptions={{
                            color: feat.properties.risk_level === 'HIGH' ? '#f97316' : '#eab308',
                            fillColor: feat.properties.risk_level === 'HIGH' ? '#f97316' : '#eab308',
                            fillOpacity: 0.12,
                            weight: 1,
                          }}
                        />
                      );
                    })}

                  {/* Thermal Hotspot Markers */}
                  {activeLayers.hotspots &&
                    layersData.hotspots?.features?.map((feat: any) => {
                      const props: HotspotProps = feat.properties;
                      const latlng: [number, number] = [feat.geometry.coordinates[1], feat.geometry.coordinates[0]];
                      const color = getMarkerColor(props.risk_level);
                      const isSelected = selectedIncident?.incident_id === props.incident_id;

                      return (
                        <CircleMarker
                          key={feat.id}
                          center={latlng}
                          radius={isSelected ? 14 : 10}
                          pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: 0.8,
                            weight: isSelected ? 3 : 1.5,
                          }}
                          eventHandlers={{
                            click: () => handleSelectHotspot(props, latlng),
                          }}
                        >
                          <Popup>
                            <div className="space-y-1 text-xs p-1">
                              <div className="font-bold text-gray-900">{props.title}</div>
                              <div className="text-gray-600 font-mono text-[11px]">{props.classification}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="font-bold text-red-600 font-mono">{props.temp_k} K</span>
                                <span className="font-bold text-amber-600 font-mono">{props.frp_mw} MW</span>
                              </div>
                              <button
                                onClick={() => handleSelectHotspot(props, latlng)}
                                className="mt-2 w-full text-center bg-sky-600 hover:bg-sky-500 text-white rounded px-2 py-1 text-[10px] font-semibold"
                              >
                                Inspect Incident Details
                              </button>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Selected Incident Panel (Side Drawer) */}
        <div className="space-y-4">
          {selectedIncident ? (
            <Card title={`Incident Panel: ${selectedIncident.title}`}>
              <div className="space-y-4">
                {/* Header & Badges */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase block">Incident ID</span>
                    <span className="font-mono text-sm font-bold text-primary">{selectedIncident.incident_id}</span>
                  </div>
                  <Badge variant={getBadgeVariant(selectedIncident.risk_level)}>
                    {selectedIncident.risk_level} (Index: {selectedIncident.risk_index})
                  </Badge>
                </div>

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950 p-3 rounded-lg border border-gray-800">
                  <div>
                    <span className="text-gray-500 block">Classification:</span>
                    <span className="font-bold text-gray-200">{selectedIncident.classification}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Prototype Confidence:</span>
                    <span className="font-mono text-sky-400 font-semibold">
                      {Math.round(selectedIncident.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Max Temperature:</span>
                    <span className="font-mono text-red-400 font-semibold">{selectedIncident.temp_k} K</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Fire Radiative Power (FRP):</span>
                    <span className="font-mono text-amber-400 font-semibold">{selectedIncident.frp_mw} MW</span>
                  </div>
                </div>

                {/* Context & Persistence */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block font-semibold">Temporal Persistence:</span>
                    <span className="text-gray-300">{selectedIncident.persistence}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block font-semibold">Nearby Infrastructure Exposure:</span>
                    <span className="text-gray-300">{selectedIncident.infrastructure}</span>
                  </div>
                </div>

                {/* Evidence Points */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence Log</h4>
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {selectedIncident.evidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Analysis Output Preview */}
                {detailedAnalysis && (
                  <div className="pt-3 border-t border-gray-800 space-y-2">
                    <span className="text-xs font-bold text-gray-400 block uppercase">SRM Reconstruction Map</span>
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-950">
                      <img src={detailedAnalysis.srm.enhanced_base64} alt="SRM" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Selected Incident Panel">
              <p className="text-xs text-gray-400 text-center py-12">
                Click any thermal hotspot marker on the map to inspect its incident panel.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
