import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Sparkles, CheckCircle2, Film, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProjectStore } from '../../store/projectStore';
import { MoceanExporter, ExportProgress } from '../../engine/exporter';
import { ExportSettings, RESOLUTION_PRESETS, ResolutionPreset } from '../../types/project';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setExportModalOpen,
    canvas,
    layers,
    projectName,
  } = useProjectStore();

  const [selectedResolution, setSelectedResolution] = useState<ResolutionPreset>(
    canvas.preset === 'Custom' ? '1080p' : canvas.preset
  );
  const [fps, setFps] = useState<number>(30);
  const [bitrateMbps, setBitrateMbps] = useState<number>(35); // 35 Mbps for crisp 4K H.264

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportCompleteBlob, setExportCompleteBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exporterRef = useRef<MoceanExporter | null>(null);

  useEffect(() => {
    if (isExportModalOpen) {
      setSelectedResolution(canvas.preset === 'Custom' ? '1080p' : canvas.preset);
      setIsExporting(false);
      setProgress(null);
      setExportCompleteBlob(null);
      setErrorMessage(null);
    }
  }, [isExportModalOpen, canvas.preset]);

  if (!isExportModalOpen) return null;

  const targetPresetConfig = RESOLUTION_PRESETS[selectedResolution] || RESOLUTION_PRESETS['4K'];

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportCompleteBlob(null);

    const exportSettings: ExportSettings = {
      resolution: selectedResolution,
      width: targetPresetConfig.width,
      height: targetPresetConfig.height,
      fps,
      format: 'mp4',
      codec: targetPresetConfig.width >= 3840 ? 'avc1.640033' : 'avc1.4d002a',
      bitrateMbps,
    };

    const exporter = new MoceanExporter();
    exporterRef.current = exporter;

    try {
      const blob = await exporter.exportVideo(
        canvas,
        exportSettings,
        layers,
        (p) => {
          setProgress(p);
          if (p.previewCanvas && previewCanvasRef.current) {
            const ctx = previewCanvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
              ctx.drawImage(
                p.previewCanvas,
                0,
                0,
                previewCanvasRef.current.width,
                previewCanvasRef.current.height
              );
            }
          }
        }
      );

      setExportCompleteBlob(blob);
      setIsExporting(false);

      // Trigger confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Automatically trigger download
      downloadBlob(blob);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        console.error('Export error:', err);
        setErrorMessage(err.message || 'Failed to export video');
      }
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setIsExporting(false);
    setProgress(null);
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const is4K = targetPresetConfig.width >= 3840;
    a.download = `${sanitizedName}_${is4K ? '4K' : targetPresetConfig.name}_${fps}fps.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-[#11131a] border border-[#222734] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222734] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Export Video (H.264 MP4)</h2>
              <span className="text-[11px] text-slate-400">
                Hardware-accelerated deterministic rendering
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              setExportModalOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isExporting && !exportCompleteBlob && (
            <div className="space-y-4">
              {/* Resolution Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['4K', '1080p', '4K_Vertical', '1080p_Vertical'] as ResolutionPreset[]).map((presetKey) => {
                    const preset = RESOLUTION_PRESETS[presetKey];
                    const isSelected = selectedResolution === presetKey;

                    return (
                      <button
                        key={presetKey}
                        onClick={() => setSelectedResolution(presetKey)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500 shadow-glow-accent/20'
                            : 'bg-[#181b24] border-[#222734] hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{preset.name}</span>
                          {presetKey.includes('4K') && (
                            <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/30">
                              4K
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block mt-1">
                          {preset.width} × {preset.height} ({preset.aspectRatio})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Framerate Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Frame Rate</label>
                  <div className="flex bg-[#181b24] p-1 rounded-xl border border-[#222734]">
                    {[30, 60].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFps(f)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          fps === f
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f} FPS {f === 30 ? '(Standard)' : '(Smooth)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Bitrate</label>
                    <span className="text-xs font-mono text-indigo-400">{bitrateMbps} Mbps</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={bitrateMbps}
                    onChange={(e) => setBitrateMbps(parseInt(e.target.value))}
                    className="w-full mt-2 accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Video Specs Summary Card */}
              <div className="p-3.5 rounded-xl bg-[#181b24]/60 border border-[#222734] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Duration: {canvas.duration.toFixed(1)}s</span>
                <span>Total Frames: {Math.round(canvas.duration * fps)}</span>
                <span>Format: MP4 (H.264 / AVC)</span>
              </div>
            </div>
          )}

          {/* Export in Progress UI */}
          {isExporting && progress && (
            <div className="space-y-4 py-2">
              {/* Offscreen Preview Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-[#222734] bg-black aspect-video flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  width={320}
                  height={180}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-white/10">
                  {progress.fps} FPS rendering speed
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    Rendering Frames ({progress.currentFrame} / {progress.totalFrames})
                  </span>
                  <span className="font-mono font-bold text-indigo-400">
                    {Math.round(progress.progress * 100)}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150 shadow-glow-accent"
                    style={{ width: `${progress.progress * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>ETA: ~{progress.estimatedSecondsLeft}s remaining</span>
                  <span>4K H.264 Hardware Encoder</span>
                </div>
              </div>
            </div>
          )}

          {/* Export Complete UI */}
          {!isExporting && exportCompleteBlob && (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">4K Render Completed!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your video has been rendered at {targetPresetConfig.width}×{targetPresetConfig.height} and downloaded.
                </p>
              </div>

              <button
                onClick={() => downloadBlob(exportCompleteBlob)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222734] bg-[#0d0e14] flex items-center justify-between">
          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              setExportModalOpen(false);
            }}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            {exportCompleteBlob ? 'Close' : 'Cancel'}
          </button>

          {!isExporting && !exportCompleteBlob && (
            <button
              onClick={handleStartExport}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow-accent hover:shadow-lg transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start 4K Export</span>
            </button>
          )}

          {isExporting && (
            <button
              onClick={handleCancelExport}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-semibold transition-colors"
            >
              Stop & Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
