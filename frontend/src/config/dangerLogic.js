/**
 * Centralized GlacierWatch Danger Level Calculation
 *
 * Combines 4 input channels:
 * 1. Water level height (cm)
 * 2. Water level rate of rise (cm/min)
 * 3. Seismic / Earthquake ground acceleration (mg)
 * 4. Camera AI image classification (DECREASING / NORMAL / RISING)
 *
 * Output:
 * - percentage: 0 to 100
 * - level: 'NORMAL' (0-39%) | 'WARNING' (40-69%) | 'DANGER' (70-100%)
 * - reasons: array of human-readable trigger causes
 * - breakdown: component score percentages
 */

export const DANGER_THRESHOLDS = {
  NORMAL_MAX: 39,
  WARNING_MAX: 69,
  DANGER_MIN: 70,
};

export function calculateDangerLevel({ waterLevel, rateOfRise, seismicMg, cameraLabel, cameraConfidence = 0.9 }) {
  let waterScore = 0;      // max 30
  let riseScore = 0;       // max 25
  let seismicScore = 0;    // max 25
  let cameraScore = 0;     // max 20
  const reasons = [];

  // 1. Water Level (baseline ~120 cm, watch >= 140 cm, danger >= 180 cm)
  const wVal = Number(waterLevel) || 120;
  if (wVal >= 180) {
    waterScore = 30;
    reasons.push(`Water level critical at ${wVal.toFixed(1)} cm (danger threshold: 180 cm)`);
  } else if (wVal >= 160) {
    waterScore = 22;
    reasons.push(`Water level high at ${wVal.toFixed(1)} cm`);
  } else if (wVal >= 140) {
    waterScore = 14;
    reasons.push(`Water level in watch band (${wVal.toFixed(1)} cm)`);
  } else if (wVal > 125) {
    waterScore = Math.min(8, ((wVal - 120) / 20) * 8);
  } else {
    waterScore = 2;
  }

  // 2. Water Rate of Rise (baseline ~0 cm/min, watch >= 0.8 cm/min, danger >= 2.0 cm/min)
  const rVal = Number(rateOfRise) || 0;
  if (rVal >= 2.0) {
    riseScore = 25;
    reasons.push(`Rapid water rise (+${rVal.toFixed(2)} cm/min ≥ danger rate)`);
  } else if (rVal >= 1.0) {
    riseScore = 16;
    reasons.push(`Water rising at +${rVal.toFixed(2)} cm/min`);
  } else if (rVal >= 0.5) {
    riseScore = 8;
  } else if (rVal > 0) {
    riseScore = 3;
  }

  // 3. Seismic Ground Acceleration (baseline ~2 mg, tremor >= 15 mg, strong >= 50 mg)
  const sVal = Number(seismicMg) || 2;
  if (sVal >= 50) {
    seismicScore = 25;
    reasons.push(`Strong earthquake shaking detected (${sVal.toFixed(1)} mg ≥ 50 mg)`);
  } else if (sVal >= 25) {
    seismicScore = 18;
    reasons.push(`Moderate seismic tremor detected (${sVal.toFixed(1)} mg)`);
  } else if (sVal >= 15) {
    seismicScore = 12;
    reasons.push(`Minor seismic tremor (${sVal.toFixed(1)} mg)`);
  } else if (sVal > 5) {
    seismicScore = 4;
  } else {
    seismicScore = 1;
  }

  // 4. Camera AI Visual Classification
  const label = (cameraLabel || 'NORMAL').toUpperCase();
  if (label === 'RISING') {
    cameraScore = 20;
    reasons.push('Camera AI visual analysis detected RISING lake state');
  } else if (label === 'DECREASING') {
    cameraScore = 12;
    reasons.push('Camera AI visual analysis detected sudden DECREASING lake state');
  } else {
    cameraScore = 2;
  }

  // Total Score (0 - 100)
  const rawTotal = Math.round(waterScore + riseScore + seismicScore + cameraScore);
  const percentage = Math.max(0, Math.min(100, rawTotal));

  // Determine Level
  let level = 'NORMAL';
  if (percentage >= DANGER_THRESHOLDS.DANGER_MIN) {
    level = 'DANGER';
  } else if (percentage > DANGER_THRESHOLDS.NORMAL_MAX) {
    level = 'WARNING';
  }

  return {
    percentage,
    level,
    reasons: reasons.length > 0 ? reasons : ['All sensor and visual parameters within safe operational limits'],
    breakdown: {
      waterScore,
      riseScore,
      seismicScore,
      cameraScore,
    },
  };
}
