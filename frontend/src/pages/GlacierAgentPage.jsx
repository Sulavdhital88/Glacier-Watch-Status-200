import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { AgentMonitoringCard } from '../components/AgentMonitoringCard';
import { ScenarioSwitcher } from '../components/ScenarioSwitcher';
import { SensorEvidenceCard } from '../components/SensorEvidenceCard';
import { HistoricalEvidenceCard } from '../components/HistoricalEvidenceCard';
import { AgentActivityLog } from '../components/AgentActivityLog';

import {
  getAgentState,
  verifyAgentIncident,
  dismissAgentIncident,
  setAgentScenario,
} from '../services/api';

export function GlacierAgentPage() {
  const navigate = useNavigate();
  const [agentState, setAgentState] = useState(null);
  const [activeScenario, setActiveScenario] = useState('investigation');

  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let reconnectTimer = null;

    async function loadAgentData() {
      try {
        const data = await getAgentState();
        if (isMounted && data) {
          setAgentState(data);
        }
      } catch (err) {
        console.warn('Agent state fetch error:', err);
      }
    }

    loadAgentData();
    const interval = setInterval(loadAgentData, 2000);

    function connectWs() {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'agent_state' && msg.data && isMounted) {
              setAgentState(msg.data);
            }
          } catch (e) {
            // ignore non-json
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
        console.warn('Agent WebSocket error:', e);
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

  const handleVerifyIncident = async (operator, notes) => {
    const updated = await verifyAgentIncident(operator, notes);
    if (updated) setAgentState(updated);
  };

  const handleDismissIncident = async (operator, reason) => {
    const updated = await dismissAgentIncident(operator, reason);
    if (updated) setAgentState(updated);
  };

  const handleSelectScenario = async (scenarioId) => {
    setActiveScenario(scenarioId);
    const updated = await setAgentScenario(scenarioId);
    if (updated) setAgentState(updated);
  };

  const handleGoToAlerts = () => {
    navigate('/');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-borderWarm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-lightRed rounded-lg text-accentRed flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-sans font-bold text-xl text-textDark tracking-tight">
                GLACIERWATCH MONITORING AGENT
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-pulse"></span>
                AUTONOMOUS CO-PILOT
              </span>
            </div>
            <p className="text-xs text-textMuted mt-0.5">
              Multi-Signal Telemetry Synthesis, GLOF Threat Reasoning &amp; Human Operator Escalation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-sans font-bold bg-cardWarm border border-borderWarm text-textDark rounded-lg hover:bg-bgCream flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scenario Evaluator Toolbar for Hackathon Judging */}
      <ScenarioSwitcher
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
      />

      {/* Hero: GlacierWatch Monitoring Agent Status & Human Verification */}
      <AgentMonitoringCard
        agentState={agentState}
        onVerify={handleVerifyIncident}
        onDismiss={handleDismissIncident}
        onScrollToAlert={handleGoToAlerts}
      />

      {/* Evidence Grid: Sensors and Historical Precedents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sensor Evidence (6 cols) */}
        <div className="lg:col-span-6">
          <SensorEvidenceCard evidence={agentState?.evidence} />
        </div>

        {/* Historical Evidence (6 cols) */}
        <div className="lg:col-span-6">
          <HistoricalEvidenceCard evidence={agentState?.evidence} />
        </div>
      </div>

      {/* Agent Activity Timeline */}
      <AgentActivityLog activityLog={agentState?.activity_log} />
    </div>
  );
}

export default GlacierAgentPage;
