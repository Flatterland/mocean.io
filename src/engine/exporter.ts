import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { CanvasSettings, ExportSettings } from '../types/project';
import { Layer } from '../types/layer';
import { renderFrame } from './renderer';

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  progress: number; // 0 to 1
  fps: number;
  estimatedSecondsLeft: number;
  previewCanvas?: HTMLCanvasElement;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

export class MoceanExporter {
  private isCancelled: boolean = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportVideo(
    canvasSettings: CanvasSettings,
    exportSettings: ExportSettings,
    layers: Layer[],
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    this.isCancelled = false;

    const width = exportSettings.width;
    const height = exportSettings.height;
    const fps = exportSettings.fps;
    const duration = canvasSettings.duration;
    const totalFrames = Math.max(1, Math.round(duration * fps));

    // Create offscreen rendering canvas at full export resolution (e.g. 3840x2160)
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;
    const ctx = renderCanvas.getContext('2d', { alpha: false, desynchronized: true })!;

    // Scale canvasSettings dimensions for renderer
    const scaledCanvasSettings: CanvasSettings = {
      ...canvasSettings,
      width,
      height,
    };

    // Calculate scale factor relative to project base dimensions
    const scaleFactorX = width / canvasSettings.width;
    const scaleFactorY = height / canvasSettings.height;

    // Scale layers for high-res export
    const exportLayers: Layer[] = layers.map((layer) => ({
      ...layer,
      transform: {
        ...layer.transform,
        x: layer.transform.x * scaleFactorX,
        y: layer.transform.y * scaleFactorY,
        width: layer.transform.width * scaleFactorX,
        height: layer.transform.height * scaleFactorY,
      },
      text: layer.text
        ? {
            ...layer.text,
            fontSize: layer.text.fontSize * scaleFactorY,
            letterSpacing: layer.text.letterSpacing * scaleFactorX,
          }
        : undefined,
      style: {
        ...layer.style,
        strokeWidth: layer.style.strokeWidth * scaleFactorY,
        shadowBlur: layer.style.shadowBlur * scaleFactorY,
        blur: layer.style.blur * scaleFactorY,
      },
    }));

    // Check if WebCodecs is available
    if (typeof window !== 'undefined' && 'VideoEncoder' in window) {
      return this.exportWithWebCodecs(
        renderCanvas,
        ctx,
        scaledCanvasSettings,
        exportSettings,
        exportLayers,
        totalFrames,
        onProgress
      );
    } else {
      return this.exportWithMediaRecorder(
        renderCanvas,
        ctx,
        scaledCanvasSettings,
        exportSettings,
        exportLayers,
        totalFrames,
        onProgress
      );
    }
  }

  private async exportWithWebCodecs(
    renderCanvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    scaledCanvasSettings: CanvasSettings,
    exportSettings: ExportSettings,
    exportLayers: Layer[],
    totalFrames: number,
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    const { width, height, fps, bitrateMbps } = exportSettings;

    // Configure MP4 Muxer
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    let encoderError: Error | null = null;

    // Determine appropriate H.264 profile string
    // avc1.640033 = High Profile, Level 5.1 (supports 4K 30/60FPS)
    // avc1.4d002a = Main Profile, Level 4.2 (1080p)
    const codecString = width >= 3840 ? 'avc1.640033' : 'avc1.4d002a';

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encoderError = e;
        console.error('WebCodecs VideoEncoder Error:', e);
      },
    });

    await videoEncoder.configure({
      codec: codecString,
      width,
      height,
      bitrate: (bitrateMbps || 30) * 1_000_000,
      framerate: fps,
      hardwareAcceleration: 'prefer-hardware',
      avc: { format: 'avc' },
    });

    const startTime = performance.now();
    const frameMicros = 1_000_000 / fps;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        videoEncoder.close();
        throw new Error('Export cancelled by user');
      }

      if (encoderError) {
        throw encoderError;
      }

      const currentTime = frameIndex / fps;

      // Render frame deterministically
      renderFrame({
        ctx,
        canvasSettings: scaledCanvasSettings,
        layers: exportLayers,
        currentTime,
        selectedLayerIds: [],
        showGizmos: false,
        showSafeAreas: false,
      });

      // Construct VideoFrame
      const timestampMicros = Math.round(frameIndex * frameMicros);
      const videoFrame = new VideoFrame(renderCanvas, {
        timestamp: timestampMicros,
        duration: Math.round(frameMicros),
      });

      const isKeyFrame = frameIndex % Math.min(30, fps) === 0;
      videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();

      // Yield event loop occasionally to keep UI responsive
      if (frameIndex % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Progress reporting
      if (onProgress) {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const framesDone = frameIndex + 1;
        const currentSpeedFps = framesDone / Math.max(0.001, elapsedSec);
        const remainingFrames = totalFrames - framesDone;
        const estimatedSecondsLeft = Math.ceil(remainingFrames / Math.max(1, currentSpeedFps));

        onProgress({
          currentFrame: framesDone,
          totalFrames,
          progress: framesDone / totalFrames,
          fps: Math.round(currentSpeedFps),
          estimatedSecondsLeft,
          previewCanvas: renderCanvas,
        });
      }
    }

    await videoEncoder.flush();
    videoEncoder.close();
    muxer.finalize();

    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  }

  private async exportWithMediaRecorder(
    renderCanvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    scaledCanvasSettings: CanvasSettings,
    exportSettings: ExportSettings,
    exportLayers: Layer[],
    totalFrames: number,
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    const { fps } = exportSettings;
    const stream = renderCanvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: (exportSettings.bitrateMbps || 25) * 1_000_000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const recordPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    recorder.start();

    const startTime = performance.now();
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Export cancelled');
      }

      const currentTime = frameIndex / fps;
      renderFrame({
        ctx,
        canvasSettings: scaledCanvasSettings,
        layers: exportLayers,
        currentTime,
        selectedLayerIds: [],
        showGizmos: false,
        showSafeAreas: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000 / fps));

      if (onProgress) {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const framesDone = frameIndex + 1;
        const currentSpeedFps = framesDone / Math.max(0.001, elapsedSec);
        const remainingFrames = totalFrames - framesDone;

        onProgress({
          currentFrame: framesDone,
          totalFrames,
          progress: framesDone / totalFrames,
          fps: Math.round(currentSpeedFps),
          estimatedSecondsLeft: Math.ceil(remainingFrames / Math.max(1, currentSpeedFps)),
          previewCanvas: renderCanvas,
        });
      }
    }

    recorder.stop();
    return recordPromise;
  }
}
