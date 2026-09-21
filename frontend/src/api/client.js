/**
 * GlacierWatch Frontend API Client
 * Uses relative URLs proxied by Vite to the backend bridge.
 */

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (_) {}
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch('/api/status');
  return handleResponse(res);
}

export async function fetchLatestCapture() {
  const res = await fetch('/api/captures/latest');
  return handleResponse(res);
}

export async function fetchRecentCaptures(limit = 24) {
  const res = await fetch(`/api/captures?limit=${limit}`);
  return handleResponse(res);
}

export async function postVerification(captureId, { decision, correctedLabel, operator, note }) {
  const res = await fetch(`/api/captures/${captureId}/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      corrected_label: correctedLabel || null,
      operator,
      note: note || null,
    }),
  });
  return handleResponse(res);
}

export async function fetchSensorsLatest() {
  const res = await fetch('/api/sensors/latest');
  return handleResponse(res);
}

export async function fetchSensorsHistory(type, range = '1h') {
  const res = await fetch(`/api/sensors/history?type=${type}&range=${range}`);
  return handleResponse(res);
}

export async function fetchSeismicEvents() {
  const res = await fetch('/api/sensors/events');
  return handleResponse(res);
}

export async function fetchSituation() {
  const res = await fetch('/api/situation');
  return handleResponse(res);
}

export async function fetchTowers() {
  const res = await fetch('/api/towers');
  return handleResponse(res);
}

export async function postSendAlert(payload) {
  const res = await fetch('/api/alerts/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchAlertsLog() {
  const res = await fetch('/api/alerts');
  return handleResponse(res);
}

export async function postDemoTrigger(scenario) {
  const res = await fetch('/api/demo/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  return handleResponse(res);
}
