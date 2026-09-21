import React, { useState, useEffect, useRef } from 'react';
import { MetricCards } from '../components/MetricCards';
import { ImageViewer } from '../components/ImageViewer';
import { AIAnalysis } from '../components/AIAnalysis';
import { MapView } from '../components/MapView';
import { AlertPanel } from '../components/AlertPanel';
import { ImageModal } from '../components/ImageModal';
import { TopCriticalAlert } from '../components/TopCriticalAlert';

import {
  getLatestImage,
  getLatestPrediction,
  getSystemStatus,
  getAgentState,
} from '../services/api';
import { DEMO_PREDICTIONS } from '../data/demoData';

export function DashboardPage() {
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [lastImageTime, setLastImageTime] = useState('07:42:13');
  const [latestCapture, setLatestCapture] = useState(null);
  const [predictionData, setPredictionData] = useState(DEMO_PREDICTIONS.NORMAL);
  const [selectedModalImage, setSelectedModalImage] = useState(null);
  const [agentState, setAgentState] = useState(null);

  const alertPanelRef = useRef(null);

  // Polling fallback every 2s + WebSocket live subscription
  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let reconnectTimer = null;

    async function loadData() {
      try {
        const [status, image, pred, agent] = await Promise.all([
          getSystemStatus(),
          getLatestImage(),
          getLatestPrediction(),
          getAgentState(),
        ]);

        if (!isMounted) return;

        if (status) {
          setSystemStatus(status.status);
          if (status.lastImageTime) setLastImageTime(status.lastImageTime);
        }

        if (image) {
          setLatestCapture(image);
        }

        if (pred) {
          setPredictionData(pred);
        }

        if (agent) {
          setAgentState(agent);
        }
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 2000);

    // Live WebSocket connection
    function connectWs() {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (!isMounted) return;

            // 1. Ingested Optical Capture (When an image is received, show water is rising)
            if ((msg.type === 'capture' || msg.type === 'new_capture') && msg.data) {
              const cap = msg.data;
              const imageUrl = cap.image_url
                ? `${cap.image_url}?t=${Date.now()}`
                : '/media/received/received_001.jpg';

              setLatestCapture({
                id: cap.id,
                imageUrl: imageUrl,
                timestamp: cap.received_at || new Date().toLocaleTimeString(),
                station: 'Station GW-001',
                source: cap.source === 'gear360' ? 'Gear 360' : (cap.filename?.includes('esp') ? 'Gear 360 (ESP32-S3)' : 'Station Camera'),
                prediction: cap.prediction,
              });

              if (cap.prediction) {
                const p = cap.prediction;
                const probs = p.probabilities || {};
                const norm = probs.NORMAL !== undefined ? probs.NORMAL : (probs.normal !== undefined ? probs.normal : 0.021);
                const rise = probs.RISING !== undefined ? probs.RISING : (probs.rising !== undefined ? probs.rising : 0.954);
                const decr = probs.DECREASING !== undefined ? probs.DECREASING : (probs.decreasing !== undefined ? probs.decreasing : 0.025);

                const rawIncoming = {
                  prediction: (p.label || 'RISING').toUpperCase(),
                  confidence: p.confidence !== undefined ? p.confidence : 0.954,
                  probabilities: {
                    NORMAL: norm,
                    RISING: rise,
                    DECREASING: decr,
                    normal: norm,
                    rising: rise,
                    decreasing: decr,
                  },
                  inferenceMs: p.inference_ms || 48,
                  timestamp: cap.received_at || new Date().toLocaleTimeString(),
                };

                setPredictionData(rawIncoming);
              }

              const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setLastImageTime(timeNow);
            }

            // 2. Monitoring Agent State Update
            if (msg.type === 'agent_state' && msg.data) {
              setAgentState(msg.data);
            }
          } catch (e) {
            // ignore non-json messages
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWs, 2000);
          }
        };

        ws.onerror = () => {
          try { ws.close(); } catch (_) {}
        };
      } catch (e) {
        console.warn('WebSocket connection error:', e);
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const rawConf = predictionData?.confidence;
  const confidencePct = rawConf !== undefined
    ? Math.round((rawConf <= 1.0 ? rawConf * 100 : rawConf) * 10) / 10
    : 94.2;
  const currentPrediction = (predictionData?.prediction || 'NORMAL').toUpperCase();

  const handleScrollToAlert = () => {
    if (alertPanelRef.current) {
      alertPanelRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getAlertStatusText = () => {
    if (agentState?.state === 'VERIFIED') return 'INCIDENT VERIFIED';
    if (agentState?.state === 'REVIEW_REQUIRED' || currentPrediction === 'RISING') return 'REVIEW REQUIRED';
    return 'MONITORING';
  };

  return (
    <div className="space-y-0">
      {/* Top High Alert Banner if > 95% decreasing or rising anomaly */}
      <TopCriticalAlert
        predictionData={predictionData}
        latestCapture={latestCapture}
        onOpenAlertBroadcast={handleScrollToAlert}
      />

      <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
        {/* 1. System Summary Cards */}
        <MetricCards
          systemStatus={systemStatus}
          lastImageTime={lastImageTime}
          confidence={confidencePct}
          alertStatus={getAlertStatusText()}
        />

        {/* 2. Plain and Simple 2x2 Observation & Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Row 1 Left: Live Optical Hero Image (7 cols) */}
          <div className="lg:col-span-7">
            <ImageViewer
              capture={latestCapture}
              onOpenModal={(url) => setSelectedModalImage(url)}
            />
          </div>

          {/* Row 1 Right: AI Observation (Perception Layer) (5 cols) */}
          <div className="lg:col-span-5">
            <AIAnalysis predictionData={predictionData} />
          </div>

          {/* Row 2 Left: Risk & Flood Path Leaflet Map (7 cols) */}
          <div className="lg:col-span-7">
            <MapView height="360px" />
          </div>

          {/* Row 2 Right: Emergency Alert Dispatch Panel (5 cols) */}
          <div className="lg:col-span-5" ref={alertPanelRef}>
            <AlertPanel
              currentPrediction={currentPrediction}
            />
          </div>
        </div>

        {/* Lightbox Modal */}
        <ImageModal
          isOpen={Boolean(selectedModalImage)}
          imageUrl={selectedModalImage}
          onClose={() => setSelectedModalImage(null)}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
