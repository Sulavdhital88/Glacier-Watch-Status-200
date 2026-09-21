import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, ImageOverlay, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  PlusCircle,
  Clock,
  ShieldAlert,
  HelpCircle,
  Lock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
} from 'lucide-react';

import { MAP_CONFIG } from '../config/map';
import { SMS_TEMPLATES, calculateSmsSegments } from '../config/templates';
import { fetchTowers, fetchRecentCaptures, fetchAlertsLog, postSendAlert, fetchStatus } from '../api/client';
import { useOperator } from '../hooks/useOperator';
import { DemoControlsDrawer } from '../components/DemoControlsDrawer';

// Custom Leaflet DivIcons
function createTowerIcon(isSelected, isAlerted, operator) {
  const bgCol = isSelected ? '#C42A45' : isAlerted ? '#C27A0E' : '#167F80';
  const borderCol = isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)';
  const ringCls = isSelected ? 'box-shadow: 0 0 0 4px rgba(196,42,69,0.4);' : '';

  return L.divIcon({
    className: 'custom-tower-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${bgCol};
        border: 2px solid ${borderCol};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        cursor: pointer;
        ${ringCls}
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
          <circle cx="12" cy="12" r="2"/>
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createStationIcon(type) {
  const col = type === 'camera' ? '#167F80' : type === 'water_level' ? '#1ba4a8' : '#C27A0E';
  return L.divIcon({
    className: 'station-marker',
    html: `
      <div style="
        background: ${col};
        border: 2px solid white;
        padding: 2px 6px;
        border-radius: 4px;
        color: white;
        font-size: 9px;
        font-weight: bold;
        text-transform: uppercase;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      ">
        ${type === 'camera' ? '📷 Cam' : type === 'water_level' ? '💧 Hydro' : '⚡ Seismic'}
      </div>
    `,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });
}

// Fit map bounds helper component
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds);
  }, [map, bounds]);
  return null;
}

export function AlertCentrePage({ isConnected }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { operator, isDialogOpen, setIsDialogOpen } = useOperator();

  const isEditMode = searchParams.get('edit') === '1';
  const preselectedEventId = searchParams.get('event');

  // Queries
  const { data: statusData } = useQuery({ queryKey: ['status'], queryFn: fetchStatus });
  const { data: initialTowers = [] } = useQuery({ queryKey: ['towers'], queryFn: fetchTowers });
  const { data: recentCaptures = [] } = useQuery({ queryKey: ['captures'], queryFn: () => fetchRecentCaptures(24) });
  const { data: alertsLog = [] } = useQuery({ queryKey: ['alerts'], queryFn: fetchAlertsLog, refetchInterval: isConnected ? false : 3000 });

  // Map state
  const [customTowers, setCustomTowers] = useState(null);
  const towers = customTowers || initialTowers;
  const [selectedTowerIds, setSelectedTowerIds] = useState([]);
  const [showCoverageCircles, setShowCoverageCircles] = useState(true);

  // Send Panel state
  const [basis, setBasis] = useState(preselectedEventId ? 'verified_lake_event' : 'drill');
  const [selectedTemplateId, setSelectedTemplateId] = useState('flood_warning');
  const [language, setLanguage] = useState('en'); // 'en' | 'ne' | 'both'
  const [messageText, setMessageText] = useState(SMS_TEMPLATES[0].english);
  const [copySuccess, setCopySuccess] = useState(false);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [typeInput, setTypeInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendCompleted, setSendCompleted] = useState(false);
  const [liveTowerProgress, setLiveTowerProgress] = useState([]);
  const holdTimerRef = useRef(null);

  // Find verified hazard capture
  const verifiedHazardCapture = useMemo(() => {
    if (preselectedEventId) {
      const match = recentCaptures.find((c) => c.id === preselectedEventId);
      if (match) return match;
    }
    return recentCaptures.find(
      (c) => c.verification && c.verification.decision === 'hazard_confirmed'
    );
  }, [recentCaptures, preselectedEventId]);

  // Handle template or language changes
  const handleTemplateChange = (tplId, lang = language) => {
    setSelectedTemplateId(tplId);
    const tpl = SMS_TEMPLATES.find((t) => t.id === tplId) || SMS_TEMPLATES[0];
    if (lang === 'en') {
      setMessageText(tpl.english);
    } else if (lang === 'ne') {
      setMessageText(tpl.nepali);
    } else {
      setMessageText(`${tpl.english}\n\n${tpl.nepali}`);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    handleTemplateChange(selectedTemplateId, newLang);
  };

  // Full message text with drill prefix if applicable
  const fullMessageToSend = useMemo(() => {
    if (basis === 'drill') {
      const prefix = language === 'ne' ? '[परीक्षण] ' : '[TEST] ';
      return `${prefix}${messageText}`;
    }
    return messageText;
  }, [basis, language, messageText]);

  // SMS segment calculation
  const smsStats = useMemo(() => {
    return calculateSmsSegments(fullMessageToSend);
  }, [fullMessageToSend]);

  // Selected towers total recipients
  const selectedTowers = useMemo(() => {
    return towers.filter((t) => selectedTowerIds.includes(t.id));
  }, [towers, selectedTowerIds]);

  const totalRecipients = useMemo(() => {
    return selectedTowers.reduce((acc, t) => acc + (t.est_recipients || 0), 0);
  }, [selectedTowers]);

  // Map Bounds in L.CRS.Simple: [[0, 0], [height, width]]
  const { height, width } = MAP_CONFIG.imageDimensions;
  const mapBounds = [
    [0, 0],
    [height, width],
  ];

  // Tower selection filters
  const handleSelectAll = () => setSelectedTowerIds(towers.map((t) => t.id));
  const handleSelectUpstream = () => setSelectedTowerIds(towers.filter((t) => t.zone === 'upstream').map((t) => t.id));
  const handleSelectDownstream = () => setSelectedTowerIds(towers.filter((t) => t.zone === 'downstream').map((t) => t.id));
  const handleClearSelection = () => setSelectedTowerIds([]);

  const toggleTower = (tid) => {
    setSelectedTowerIds((prev) =>
      prev.includes(tid) ? prev.filter((id) => id !== tid) : [...prev, tid]
    );
  };

  // Send Validation Check
  const canSend = useMemo(() => {
    if (selectedTowerIds.length === 0) return { ok: false, reason: 'Select at least one tower' };
    if (!messageText.trim()) return { ok: false, reason: 'Message text is empty' };
    if (basis === 'verified_lake_event' && !verifiedHazardCapture) {
      return { ok: false, reason: 'No verified hazard capture available' };
    }
    return { ok: true, reason: '' };
  }, [selectedTowerIds, messageText, basis, verifiedHazardCapture]);

  // Send Mutation
  const sendMutation = useMutation({
    mutationFn: (payload) => postSendAlert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSendCompleted(true);
      setIsSending(false);
    },
    onError: (err) => {
      alert(`Send failed: ${err.message}`);
      setIsSending(false);
    },
  });

  // Hold-to-send interaction
  const handleHoldStart = () => {
    if (isSending || sendCompleted) return;
    const startTime = Date.now();
    const duration = 1200; // 1.2s

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setHoldProgress(pct);

      if (pct >= 100) {
        clearInterval(holdTimerRef.current);
        executeSend();
      }
    }, 30);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const executeSend = () => {
    setIsSending(true);

    // Initialise live tower progress rows
    setLiveTowerProgress(
      selectedTowers.map((t) => ({
        id: t.id,
        name: t.name,
        status: 'queued',
      }))
    );

    sendMutation.mutate({
      tower_ids: selectedTowerIds,
      message: fullMessageToSend,
      languages: language === 'both' ? ['en', 'ne'] : [language],
      basis,
      operator: operator || 'Field Duty Officer',
      confirmed: true,
      event_id: basis === 'verified_lake_event' ? verifiedHazardCapture?.id : null,
    });
  };

  const handleTypeSendSubmit = (e) => {
    e.preventDefault();
    if (typeInput.trim().toUpperCase() === 'SEND') {
      executeSend();
    }
  };

  const isLiveSms = statusData?.sms_mode === 'live';

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-5">
      {/* Top Banner & Edit Mode Tool */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-crevasse uppercase tracking-wider">
            Alert Centre & Emergency Broadcast
          </h1>
          <p className="text-xs text-granite/70">
            Field-survey cell broadcast mapping and human-in-the-loop SMS dispatch
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center space-x-2 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded text-xs text-amber-900">
            <span className="font-bold">Edit Mode Active:</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(towers, null, 2));
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
              }}
              className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 rounded font-mono font-medium flex items-center space-x-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copySuccess ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Map (Left 7 cols) & Send Panel (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Section */}
        <div className="lg:col-span-7 bg-paper rounded border border-borderHairline p-3.5 space-y-3">
          {/* Map Toolbar */}
          <div className="flex flex-wrap items-center justify-between text-xs gap-2 select-none">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 bg-mist hover:bg-granite/10 rounded font-medium text-granite transition-colors"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleSelectUpstream}
                className="px-2.5 py-1 bg-mist hover:bg-granite/10 rounded font-medium text-granite transition-colors"
              >
                Upstream
              </button>
              <button
                type="button"
                onClick={handleSelectDownstream}
                className="px-2.5 py-1 bg-mist hover:bg-granite/10 rounded font-medium text-granite transition-colors"
              >
                Downstream
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 bg-mist hover:bg-granite/10 rounded text-granite/70 hover:text-granite transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1.5 cursor-pointer text-granite/80 font-medium">
                <input
                  type="checkbox"
                  checked={showCoverageCircles}
                  onChange={(e) => setShowCoverageCircles(e.target.checked)}
                  className="rounded text-glacial focus:ring-glacial"
                />
                <span>Coverage radii</span>
              </label>

              <span className="text-[11px] font-mono text-granite/50 bg-mist px-2 py-0.5 rounded">
                Demo Data (No real numbers)
              </span>
            </div>
          </div>

          {/* Leaflet Map Container */}
          <div className="relative w-full h-[520px] bg-crevasse rounded overflow-hidden border border-borderDark shadow-inner">
            <MapContainer
              crs={L.CRS.Simple}
              bounds={mapBounds}
              minZoom={MAP_CONFIG.minZoom}
              maxZoom={MAP_CONFIG.maxZoom}
              zoomControl={true}
              attributionControl={true}
              style={{ height: '100%', width: '100%' }}
            >
              <MapBoundsController bounds={mapBounds} />

              {/* Static Valley Terrain Map Overlay */}
              <ImageOverlay
                url={MAP_CONFIG.imagePath}
                bounds={mapBounds}
                attribution={MAP_CONFIG.attribution}
              />

              {/* Multi-hazard Station Info Markers */}
              {MAP_CONFIG.stations.map((stn) => {
                const lat = (1 - stn.y_pct / 100) * height;
                const lng = (stn.x_pct / 100) * width;
                return (
                  <Marker
                    key={stn.id}
                    position={[lat, lng]}
                    icon={createStationIcon(stn.type)}
                    interactive={false}
                  />
                );
              })}

              {/* Cell Tower Interactive Markers & Coverage Circles */}
              {towers.map((tower) => {
                const lat = (1 - tower.y_pct / 100) * height;
                const lng = (tower.x_pct / 100) * width;
                const isSelected = selectedTowerIds.includes(tower.id);
                const radiusPx = (tower.radius_pct / 100) * width;

                return (
                  <React.Fragment key={tower.id}>
                    {showCoverageCircles && (
                      <Circle
                        center={[lat, lng]}
                        radius={radiusPx}
                        pathOptions={{
                          color: isSelected ? '#C42A45' : '#167F80',
                          fillColor: isSelected ? '#C42A45' : '#167F80',
                          fillOpacity: isSelected ? 0.25 : 0.12,
                          weight: isSelected ? 2 : 1,
                          dashArray: isSelected ? undefined : '4, 4',
                        }}
                      />
                    )}

                    <Marker
                      position={[lat, lng]}
                      icon={createTowerIcon(isSelected, false, tower.operator)}
                      eventHandlers={{
                        click: () => toggleTower(tower.id),
                      }}
                    >
                      <Popup className="text-xs font-sans">
                        <div className="space-y-1">
                          <div className="font-bold text-crevasse">{tower.name}</div>
                          <div className="text-granite/70">
                            Operator: <strong>{tower.operator}</strong>
                          </div>
                          <div className="text-granite/70">
                            Zone: <strong>{tower.zone}</strong> • Est:{' '}
                            <strong className="text-glacial">{tower.est_recipients} people</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleTower(tower.id)}
                            className="mt-1 w-full py-1 bg-glacial text-white rounded text-[10px] font-bold"
                          >
                            {isSelected ? 'Deselect tower' : 'Select tower'}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-granite/60 font-mono select-none px-1">
            <div>
              Selected:{' '}
              <strong className="text-crevasse">{selectedTowerIds.length} of {towers.length} towers</strong>
            </div>
            <div>
              Est. reach:{' '}
              <strong className="text-glacial">{totalRecipients.toLocaleString()} recipients</strong>
            </div>
          </div>
        </div>

        {/* Send Panel (Right 5 cols) */}
        <div className="lg:col-span-5 bg-paper rounded border border-borderHairline p-5 space-y-4">
          <div className="border-b border-borderHairline pb-2.5 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-crevasse uppercase tracking-wider">
              Emergency Broadcast Panel
            </h2>
            {isLiveSms ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rhododendron text-white animate-pulse">
                Live Gateway
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-mist text-granite/70">
                Mock Mode
              </span>
            )}
          </div>

          {/* 1. Reason / Basis Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-crevasse uppercase tracking-wider">
              1. Reason for Broadcast
            </label>
            <div className="space-y-1.5 text-xs">
              {/* Option A: Verified Lake Event */}
              <label
                className={`flex items-start space-x-2.5 p-2.5 rounded border transition-colors cursor-pointer ${
                  basis === 'verified_lake_event'
                    ? 'border-glacial bg-glacial/5'
                    : 'border-borderHairline hover:bg-mist/30'
                } ${!verifiedHazardCapture ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="basis"
                  value="verified_lake_event"
                  checked={basis === 'verified_lake_event'}
                  onChange={() => verifiedHazardCapture && setBasis('verified_lake_event')}
                  disabled={!verifiedHazardCapture}
                  className="mt-0.5 text-glacial focus:ring-glacial"
                />
                <div className="space-y-1 w-full">
                  <div className="font-semibold text-crevasse">Verified lake event</div>
                  {verifiedHazardCapture ? (
                    <div className="flex items-center space-x-2 text-[11px] text-granite/80 bg-mist p-1.5 rounded">
                      <div className="w-10 h-8 bg-black rounded overflow-hidden flex-shrink-0">
                        <img
                          src={verifiedHazardCapture.image_url}
                          alt="Hazard Capture"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-rhododendron">
                          {verifiedHazardCapture.id}
                        </span>{' '}
                        ({verifiedHazardCapture.prediction?.label}) • Verified by{' '}
                        {verifiedHazardCapture.verification?.operator}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-granite/50 italic">
                      No hazard-confirmed camera captures available. Verify a capture on Live monitor first.
                    </div>
                  )}
                </div>
              </label>

              {/* Option B: Sensor Event */}
              <label
                className={`flex items-center space-x-2.5 p-2.5 rounded border transition-colors cursor-pointer ${
                  basis === 'sensor_event'
                    ? 'border-glacial bg-glacial/5'
                    : 'border-borderHairline hover:bg-mist/30'
                }`}
              >
                <input
                  type="radio"
                  name="basis"
                  value="sensor_event"
                  checked={basis === 'sensor_event'}
                  onChange={() => setBasis('sensor_event')}
                  className="text-glacial focus:ring-glacial"
                />
                <div>
                  <div className="font-semibold text-crevasse">Sensor event</div>
                  <div className="text-[11px] text-granite/60">
                    Water rate of rise or seismic shaking anomaly
                  </div>
                </div>
              </label>

              {/* Option C: Drill / Test */}
              <label
                className={`flex items-center space-x-2.5 p-2.5 rounded border transition-colors cursor-pointer ${
                  basis === 'drill'
                    ? 'border-glacial bg-glacial/5'
                    : 'border-borderHairline hover:bg-mist/30'
                }`}
              >
                <input
                  type="radio"
                  name="basis"
                  value="drill"
                  checked={basis === 'drill'}
                  onChange={() => setBasis('drill')}
                  className="text-glacial focus:ring-glacial"
                />
                <div>
                  <div className="font-semibold text-crevasse">Drill or field test</div>
                  <div className="text-[11px] text-granite/60">
                    Adds non-editable [TEST] prefix to message
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Selected Towers Summary */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-crevasse uppercase tracking-wider">
              <span>2. Selected Cell Towers ({selectedTowerIds.length})</span>
              <span className="text-glacial">{totalRecipients.toLocaleString()} people</span>
            </div>
            {selectedTowerIds.length === 0 ? (
              <div className="p-2 bg-mist/60 rounded text-center text-granite/50 italic text-[11px]">
                Click markers on the map to select target cell towers
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-mist/30 rounded border border-borderHairline">
                {selectedTowers.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 bg-paper rounded border border-borderHairline text-[10px] text-granite font-mono"
                  >
                    <span>{t.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleTower(t.id)}
                      className="text-granite/40 hover:text-rhododendron font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. Message Template & Language Controls */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-crevasse uppercase tracking-wider">
              <span>3. Message Text</span>
              <div className="flex space-x-1 bg-mist p-0.5 rounded border border-borderHairline">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    language === 'en' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ne')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium font-devanagari ${
                    language === 'ne' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                  }`}
                >
                  नेपाली
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('both')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    language === 'both' ? 'bg-paper text-crevasse font-bold shadow-xs' : 'text-granite/60'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Template Select */}
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-granite/20 rounded text-xs text-granite focus:border-glacial"
            >
              {SMS_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  Template: {tpl.name}
                </option>
              ))}
            </select>

            {/* Textarea */}
            <div className="relative">
              {basis === 'drill' && (
                <div className="absolute top-2 left-2.5 bg-amber-200 text-amber-900 px-1 py-0.5 rounded text-[10px] font-bold font-mono pointer-events-none">
                  {language === 'ne' ? '[परीक्षण]' : '[TEST]'}
                </div>
              )}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                style={{ paddingTop: basis === 'drill' ? '28px' : '8px' }}
                className="w-full px-2.5 py-2 bg-white border border-granite/20 rounded text-xs text-granite font-sans leading-relaxed focus:border-glacial focus:ring-1 focus:ring-glacial"
              />
            </div>

            {/* SMS Segment & Encoding Counter */}
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-granite/70 pt-0.5">
              <div>
                Encoding: <strong className="text-crevasse">{smsStats.encoding}</strong> ({smsStats.maxPerSegment} chars/part)
              </div>
              <div className="text-right">
                <span>{smsStats.chars} chars • </span>
                <strong className={smsStats.segments > 1 ? 'text-ochre font-bold' : 'text-glacial'}>
                  {smsStats.segments} SMS per recipient
                </strong>
              </div>
            </div>
          </div>

          {/* 4. Send Action Button */}
          <div className="pt-2 border-t border-borderHairline space-y-2">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!canSend.ok}
              className={`w-full py-3 px-4 rounded text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm ${
                canSend.ok
                  ? 'bg-rhododendron hover:bg-red-700 text-white cursor-pointer ring-1 ring-red-800'
                  : 'bg-mist text-granite/40 border border-borderHairline cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedTowerIds.length > 0
                  ? `Send SMS to ${selectedTowerIds.length} towers (about ${totalRecipients.toLocaleString()} people)`
                  : 'Send SMS Alert'}
              </span>
            </button>

            {!canSend.ok && (
              <div className="text-[11px] text-rhododendron text-center font-medium">
                Cannot send: {canSend.reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Alert Log Table */}
      <div className="bg-paper p-5 rounded border border-borderHairline space-y-3">
        <div className="flex items-center justify-between border-b border-borderHairline pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-glacial" />
            <span className="font-display font-bold text-lg text-crevasse uppercase tracking-wider">
              Alert Broadcast Audit Log ({alertsLog.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-granite/50">
            Immutable Audit Trail
          </span>
        </div>

        <div className="border border-borderHairline rounded overflow-hidden text-xs">
          <table className="w-full text-left font-sans">
            <thead className="bg-mist/80 text-[10px] text-granite/70 uppercase font-mono">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Operator</th>
                <th className="py-2 px-3">Reason</th>
                <th className="py-2 px-3">Towers & Reach</th>
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3">Message Excerpt</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderHairline text-[11px]">
              {alertsLog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 px-3 text-center text-granite/50 italic">
                    No emergency SMS alerts broadcast yet
                  </td>
                </tr>
              ) : (
                alertsLog.map((alt) => (
                  <tr key={alt.id} className="hover:bg-mist/30">
                    <td className="py-2 px-3 font-mono tabular-nums whitespace-nowrap">
                      {alt.sent_at}
                    </td>
                    <td className="py-2 px-3 font-semibold text-crevasse">
                      {alt.operator}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 bg-mist rounded font-bold uppercase">
                        {alt.basis}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums">
                      {alt.tower_ids?.length} towers ({alt.est_recipients?.toLocaleString()} people)
                    </td>
                    <td className="py-2 px-3 font-mono uppercase text-[10px]">
                      {alt.mode === 'live' ? (
                        <span className="text-rhododendron font-bold">LIVE</span>
                      ) : (
                        <span className="text-granite/60">MOCK</span>
                      )}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate text-granite/80" title={alt.message}>
                      {alt.message}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {alt.status || 'delivered'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal with Hold-to-Send and Type SEND alternative */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-crevasse/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-paper border border-borderHairline rounded-lg shadow-modal w-full max-w-lg p-6 text-granite space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-borderHairline pb-3">
              <div className="p-2 bg-rhododendron/10 text-rhododendron rounded-full">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-crevasse uppercase tracking-wide">
                  Confirm Emergency Broadcast
                </h3>
                <p className="text-xs text-granite/70">
                  {isLiveSms
                    ? 'LIVE GATEWAY: Real SMS will be transmitted'
                    : 'Mock send: no real SMS will be sent.'}
                </p>
              </div>
            </div>

            {/* Broadcast Details Summary */}
            <div className="p-3 bg-mist/60 rounded border border-borderHairline space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-granite/50 font-mono">Basis:</span>{' '}
                  <strong className="text-crevasse uppercase">{basis}</strong>
                </div>
                <div>
                  <span className="text-granite/50 font-mono">Operator:</span>{' '}
                  <strong className="text-crevasse">{operator || 'Duty Officer'}</strong>
                </div>
                <div>
                  <span className="text-granite/50 font-mono">Target Towers:</span>{' '}
                  <strong>{selectedTowerIds.length} towers</strong>
                </div>
                <div>
                  <span className="text-granite/50 font-mono">Estimated Reach:</span>{' '}
                  <strong className="text-glacial">{totalRecipients.toLocaleString()} people</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-borderHairline">
                <span className="text-granite/50 font-mono block mb-1">Full Message Content:</span>
                <div className="bg-white p-2 rounded border border-borderHairline font-sans text-xs whitespace-pre-wrap">
                  {fullMessageToSend}
                </div>
              </div>
            </div>

            {/* Live Progress Display if sending */}
            {isSending || sendCompleted ? (
              <div className="space-y-3 py-2">
                <div className="text-xs font-semibold text-crevasse flex items-center justify-between">
                  <span>{sendCompleted ? 'Broadcast Complete' : 'Transmitting to Cell Towers...'}</span>
                  {sendCompleted && (
                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Sent to {selectedTowerIds.length} towers</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedTowers.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-mist rounded font-mono"
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">
                        {sendCompleted ? 'delivered' : 'sending...'}
                      </span>
                    </div>
                  ))}
                </div>

                {sendCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmOpen(false);
                      setSendCompleted(false);
                      setHoldProgress(0);
                    }}
                    className="w-full py-2 bg-glacial text-white rounded font-bold text-xs hover:bg-cyan-800 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            ) : (
              /* Confirmation Controls */
              <div className="space-y-4 pt-2">
                {/* Method 1: Hold to Send button */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    className="relative w-full py-3.5 bg-rhododendron text-white font-bold rounded overflow-hidden select-none hover:bg-red-700 transition-colors shadow-sm"
                  >
                    {/* Fill Progress Animation */}
                    <div
                      className="absolute inset-0 bg-red-900 transition-all"
                      style={{ width: `${holdProgress}%` }}
                    />
                    <span className="relative z-10 flex items-center justify-center space-x-2 text-xs">
                      <Lock className="w-4 h-4" />
                      <span>
                        {holdProgress > 0
                          ? `Holding... ${holdProgress}%`
                          : 'Hold to send (1.2 seconds)'}
                      </span>
                    </span>
                  </button>
                  <p className="text-[10px] text-granite/50 text-center font-mono">
                    Press and hold to prevent accidental early dispatch
                  </p>
                </div>

                {/* Method 2: Accessible Type SEND Alternative */}
                <form onSubmit={handleTypeSendSubmit} className="pt-2 border-t border-borderHairline space-y-2">
                  <label className="block text-[11px] text-granite/70">
                    Keyboard alternative: type <strong className="font-mono text-crevasse">SEND</strong> and press Enter:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      placeholder="Type SEND"
                      className="flex-1 px-3 py-1.5 border border-granite/20 rounded text-xs font-mono uppercase focus:border-glacial"
                    />
                    <button
                      type="submit"
                      disabled={typeInput.trim().toUpperCase() !== 'SEND'}
                      className={`px-4 py-1.5 rounded text-xs font-bold ${
                        typeInput.trim().toUpperCase() === 'SEND'
                          ? 'bg-rhododendron text-white'
                          : 'bg-mist text-granite/40 cursor-not-allowed'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </form>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmOpen(false);
                      setHoldProgress(0);
                    }}
                    className="text-xs text-granite/60 hover:text-granite"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Demo Simulation Controls Drawer */}
      <DemoControlsDrawer isDemoMode={true} />
    </div>
  );
}
