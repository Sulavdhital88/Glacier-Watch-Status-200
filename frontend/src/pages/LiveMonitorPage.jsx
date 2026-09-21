import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLatestCapture,
  fetchRecentCaptures,
  fetchSensorsLatest,
  fetchSituation,
  fetchTowers,
  postVerification,
} from '../api/client';
import { useOperator } from '../hooks/useOperator';
import { useAlarm } from '../hooks/useAlarm';
import { calculateDangerLevel } from '../config/dangerLogic';

import { DangerLevel } from '../components/DangerLevel';
import { WaterLevelCard } from '../components/WaterLevelCard';
import { EarthquakeCard } from '../components/EarthquakeCard';
import { LatestCameraImage } from '../components/LatestCameraImage';
import { GlacierRiverMap } from '../components/GlacierRiverMap';
import { AdminVerificationSection } from '../components/AdminVerificationSection';
import { AdminReviewModal } from '../components/AdminReviewModal';
import { CitizenAlertModal } from '../components/CitizenAlertModal';
import { Lightbox } from '../components/Lightbox';
import { DemoControlsDrawer } from '../components/DemoControlsDrawer';

export function LiveMonitorPage({ isConnected }) {
  const queryClient = useQueryClient();
  const { operator, isDialogOpen, setIsDialogOpen } = useOperator();

  // Modals & UI state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCitizenAlertOpen, setIsCitizenAlertOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  // Queries
  const { data: latestCapture } = useQuery({
    queryKey: ['latest_capture'],
    queryFn: fetchLatestCapture,
    refetchInterval: isConnected ? false : 3000,
  });

  const { data: sensorsData } = useQuery({
    queryKey: ['sensors_latest'],
    queryFn: fetchSensorsLatest,
    refetchInterval: isConnected ? false : 3000,
  });

  const { data: situation } = useQuery({
    queryKey: ['situation'],
    queryFn: fetchSituation,
    refetchInterval: isConnected ? false : 3000,
  });

  const { data: towers = [] } = useQuery({
    queryKey: ['towers'],
    queryFn: fetchTowers,
  });

  const water = sensorsData?.water_level;
  const seismic = sensorsData?.seismic;
  const cameraLabel = latestCapture?.prediction?.label || 'NORMAL';
  const cameraConfidence = latestCapture?.prediction?.confidence || 0.9;

  // Centralized Danger Level Calculation
  const dangerInfo = useMemo(() => {
    return calculateDangerLevel({
      waterLevel: water?.value_cm,
      rateOfRise: water?.rate_of_rise_cm_min,
      seismicMg: seismic?.peak_mg,
      cameraLabel,
      cameraConfidence,
    });
  }, [water?.value_cm, water?.rate_of_rise_cm_min, seismic?.peak_mg, cameraLabel, cameraConfidence]);

  // Audio Alarm Hook
  const { isAlarmPlaying, silenceAlarm } = useAlarm(dangerInfo.level);

  // Verification State
  const isConfirmed = Boolean(
    latestCapture?.verification && latestCapture.verification.decision === 'hazard_confirmed'
  );

  // Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: ({ decision, note }) => {
      if (!latestCapture?.id) throw new Error('No capture available to verify');
      return postVerification(latestCapture.id, {
        decision,
        correctedLabel: null,
        operator: operator || 'Field Duty Officer',
        note,
      });
    },
    onSuccess: (updatedCap, variables) => {
      queryClient.invalidateQueries({ queryKey: ['latest_capture'] });
      queryClient.invalidateQueries({ queryKey: ['captures'] });
      queryClient.invalidateQueries({ queryKey: ['situation'] });
      setIsReviewModalOpen(false);

      if (variables.decision === 'hazard_confirmed') {
        setIsCitizenAlertOpen(true);
      }
    },
    onError: (err) => {
      alert(`Verification error: ${err.message}`);
    },
  });

  const handleConfirmDanger = (note) => {
    if (!operator) {
      setIsDialogOpen(true);
      return;
    }
    verifyMutation.mutate({ decision: 'hazard_confirmed', note });
  };

  const handleDismissSafe = (note) => {
    if (!operator) {
      setIsDialogOpen(true);
      return;
    }
    verifyMutation.mutate({ decision: 'no_hazard', note });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      {/* 1. Executive Status & Danger Banner */}
      <DangerLevel
        dangerInfo={dangerInfo}
        isAlarmPlaying={isAlarmPlaying}
        onSilenceAlarm={silenceAlarm}
      />

      {/* 2. Main Executive 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols): Camera & Telemetry */}
        <div className="lg:col-span-5 space-y-5">
          {/* Latest Camera Feed with 3-Class AI Split */}
          <LatestCameraImage
            capture={latestCapture}
            onOpenLightbox={(url) => setLightboxImageUrl(url)}
          />

          {/* Simple 2-Card Sensor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WaterLevelCard waterData={water} />
            <EarthquakeCard seismicData={seismic} />
          </div>
        </div>

        {/* Right Column (7 cols): Clean Simple Glacier Lake & River Path Map */}
        <div className="lg:col-span-7 space-y-5">
          <GlacierRiverMap
            dangerLevel={dangerInfo.level}
            className="min-h-[520px]"
          />

          {/* Operator Gatekeeper Verification Bar */}
          <AdminVerificationSection
            dangerInfo={dangerInfo}
            isConfirmed={isConfirmed}
            onOpenReview={() => setIsReviewModalOpen(true)}
            onOpenCitizenAlert={() => setIsCitizenAlertOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <AdminReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        dangerInfo={dangerInfo}
        waterData={water}
        seismicData={seismic}
        capture={latestCapture}
        operator={operator}
        onConfirmDanger={handleConfirmDanger}
        onDismissSafe={handleDismissSafe}
        isSubmitting={verifyMutation.isPending}
      />

      <CitizenAlertModal
        isOpen={isCitizenAlertOpen}
        onClose={() => setIsCitizenAlertOpen(false)}
        towers={towers}
        captureId={latestCapture?.id}
        operator={operator}
        onAlertDispatched={() => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }}
      />

      {lightboxImageUrl && (
        <Lightbox
          src={lightboxImageUrl}
          alt={latestCapture?.filename}
          caption={`${latestCapture?.id || 'Capture'} — ${latestCapture?.received_at}`}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}

      {/* Demo Controls Drawer */}
      <DemoControlsDrawer isDemoMode={true} />
    </div>
  );
}
export default LiveMonitorPage;
