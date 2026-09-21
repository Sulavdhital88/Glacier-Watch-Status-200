import React from 'react';
import { Cpu, Radio, Shield, Info, CheckCircle2, HardDrive, Wifi } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1440px] mx-auto">
      {/* Title */}
      <div>
        <h2 className="font-sans font-bold text-lg md:text-xl text-textDark">
          System &amp; Hardware Pipeline Settings
        </h2>
        <p className="text-xs text-textMuted mt-0.5">
          Edge telemetry transceiver pipeline, camera capture orchestration, and operational guardrails
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Hardware Architecture & Edge Pipeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hardware Pipeline Architecture */}
          <div className="bg-cardWarm p-6 rounded-xl border border-borderWarm shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-borderWarm">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-accentSuccess" />
                <h3 className="font-sans font-bold text-sm text-textDark">
                  Physical Edge Hardware Pipeline
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-accentSuccess border border-accentSuccess/30">
                ACTIVE PIPELINE
              </span>
            </div>

            <p className="text-xs text-textMuted leading-relaxed">
              End-to-end multi-hop pipeline transmitting optical GLOF imagery across remote alpine terrain without commercial cellular dependency.
            </p>

            <div className="font-mono text-xs text-textDark space-y-2.5 bg-bgCream/60 p-4 rounded-lg border border-borderWarm">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-accentRed">1.</span>
                <span className="font-semibold">Samsung Gear 360 Camera</span>
                <span className="text-[10px] text-textMuted">(Manual HDR Mode)</span>
              </div>
              <div className="text-textMuted pl-5 text-[11px]">↓ WiFi HTTP rawcmd shutter trigger &amp; JPEG pull</div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-accentRed">2.</span>
                <span className="font-semibold">ESP32-S3 Transmitter (N16R8, 16MB Flash)</span>
              </div>
              <div className="text-textMuted pl-5 text-[11px]">↓ ESP-NOW 240-byte packetization + hardware ACK (Zero WiFi router needed)</div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-accentRed">3.</span>
                <span className="font-semibold">ESP32-S3 Receiver (N8R8, COM4 Serial @ 2,000,000 baud)</span>
              </div>
              <div className="text-textMuted pl-5 text-[11px]">↓ CRC32 validated JPEG written to received_images/</div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-accentRed">4.</span>
                <span className="font-semibold">GlacierWatch MobileNetV2 Classifier + FastAPI</span>
              </div>
              <div className="text-textMuted pl-5 text-[11px]">↓ 3-Class inference (DECREASING, NORMAL, RISING) + WebSocket dispatch</div>
            </div>
          </div>

          {/* Radio Specifications */}
          <div className="bg-cardWarm p-5 rounded-xl border border-borderWarm shadow-card space-y-3.5">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-borderWarm">
              <Wifi className="w-4 h-4 text-accentRed" />
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-textMuted">
                TRANSCEIVER TELEMETRY SPECIFICATIONS
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-bgCream/40 rounded-lg border border-borderWarm">
                <span className="text-[10px] text-textMuted uppercase block">Protocol</span>
                <span className="font-bold text-textDark">ESP-NOW 2.4 GHz</span>
              </div>
              <div className="p-3 bg-bgCream/40 rounded-lg border border-borderWarm">
                <span className="text-[10px] text-textMuted uppercase block">Serial Ingestion</span>
                <span className="font-bold text-textDark">2,000,000 Baud</span>
              </div>
              <div className="p-3 bg-bgCream/40 rounded-lg border border-borderWarm">
                <span className="text-[10px] text-textMuted uppercase block">Error Detection</span>
                <span className="font-bold text-textDark">CRC32 + Frame ACK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (5 cols): Scientific & Operational Guardrails */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-cardWarm p-6 rounded-xl border border-borderWarm shadow-card space-y-3.5">
            <div className="flex items-center space-x-2 pb-3 border-b border-borderWarm">
              <Shield className="w-4 h-4 text-accentRed" />
              <h3 className="font-sans font-bold text-sm text-textDark">
                Product &amp; Safety Guardrails
              </h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-textDark">
              <div className="p-3.5 bg-bgCream/60 rounded-lg border border-borderWarm space-y-1">
                <strong className="text-accentRed font-bold block">1. The AI Never Alerts Anyone</strong>
                <p className="text-textMuted">
                  Model inference is advisory only. The backend strictly rejects any broadcast request that lacks explicit verification by an on-duty operator.
                </p>
              </div>

              <div className="p-3.5 bg-bgCream/60 rounded-lg border border-borderWarm space-y-1">
                <strong className="text-accentRed font-bold block">2. Confidence is Not Correctness</strong>
                <p className="text-textMuted">
                  The dashboard displays the full 3-way probability split and never presents high confidence as verified fact.
                </p>
              </div>

              <div className="p-3.5 bg-bgCream/60 rounded-lg border border-borderWarm space-y-1">
                <strong className="text-textDark font-bold block">3. Validation Accuracy Context</strong>
                <p className="text-textMuted">
                  The <strong>93.48%</strong> figure represents validation accuracy of the MobileNetV2 3-class classifier on 46 held-out test images. It is not operational GLOF detection accuracy.
                </p>
              </div>

              <div className="p-3.5 bg-bgCream/60 rounded-lg border border-borderWarm space-y-1">
                <strong className="text-textDark font-bold block">4. Multi-Sensor Confirmation</strong>
                <p className="text-textMuted">
                  High-risk advisories trigger cross-validation with hydrological and seismic gauges before operator alert broadcast confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
