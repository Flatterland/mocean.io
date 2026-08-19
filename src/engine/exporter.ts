import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { CanvasSettings, ExportSettings } from '../types/project';
import { Layer } from '../types/layer';
import { renderFrame, getCachedVideo } from './renderer';

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  progress: number;
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

    // Strict even dimensions
    const width = Math.max(2, Math.floor(exportSettings.width / 2) * 2);
    const height = Math.max(2, Math.floor(exportSettings.height / 2) * 2);
    const fps = Math.max(1, Math.min(60, exportSettings.fps || 30));
    const duration = canvasSettings.duration;
    const totalFrames = Math.max(1, Math.round(duration * fps));

    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;
    const ctx = renderCanvas.getContext('2d', { alpha: false, willReadFrequently: false })!;

    const scaledCanvasSettings: CanvasSettings = {
      ...canvasSettings,
      width,
      height,
    };

    const scaleFactorX = width / canvasSettings.width;
    const scaleFactorY = height / canvasSettings.height;

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

    if (typeof window !== 'undefined' && 'VideoEncoder' in window) {
      try {
        return await this.exportWithWebCodecs(
          renderCanvas,
          ctx,
          scaledCanvasSettings,
          { ...exportSettings, width, height, fps },
          exportLayers,
          totalFrames,
          onProgress
        );
      } catch (err: any) {
        if (this.isCancelled) throw err;
        console.warn('WebCodecs export failed, falling back to MediaRecorder:', err);
      }
    }

    return this.exportWithMediaRecorder(
      renderCanvas,
      ctx,
      scaledCanvasSettings,
      { ...exportSettings, width, height, fps },
      exportLayers,
      totalFrames,
      onProgress
    );
  }

  private async prepareVideoLayers(layers: Layer[], currentTime: number) {
    const promises: Promise<void>[] = [];

    for (const layer of layers) {
      if (layer.type === 'video' && layer.visible && layer.video?.src) {
        if (currentTime >= layer.startTime && currentTime <= layer.endTime) {
          const video = getCachedVideo(layer.video.src);
          const localTime = Math.max(0, currentTime - layer.startTime);
          const targetSeekTime = (layer.video.trimStart || 0) + localTime * (layer.video.playbackRate || 1.0);

          if (video.readyState >= 2 && Math.abs(video.currentTime - targetSeekTime) > 0.05) {
            promises.push(
              new Promise<void>((resolve) => {
                let resolved = false;
                const onSeeked = () => {
                  if (resolved) return;
                  resolved = true;
                  video.removeEventListener('seeked', onSeeked);
                  resolve();
                };
                video.addEventListener('seeked', onSeeked);
                video.currentTime = targetSeekTime;
                
                // Fallback timeout in case video gets stuck buffering
                setTimeout(() => {
                  if (resolved) return;
                  resolved = true;
                  video.removeEventListener('seeked', onSeeked);
                  resolve();
                }, 500);
              })
            );
          }
        }
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
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
    const frameDurationMicros = Math.round(1_000_000 / fps);

    // Determine supported encoder configuration
    const candidateCodecs = [
      { codecString: 'avc1.640033', muxerCodec: 'avc' as const },
      { codecString: 'avc1.640028', muxerCodec: 'avc' as const },
      { codecString: 'avc1.4d002a', muxerCodec: 'avc' as const },
      { codecString: 'avc1.42001f', muxerCodec: 'avc' as const },
      { codecString: 'avc1.42001e', muxerCodec: 'avc' as const },
      { codecString: 'vp09.00.10.08', muxerCodec: 'vp9' as const },
    ];

    let selectedConfig: { codecString: string; muxerCodec: 'avc' | 'vp9' } | null = null;

    for (const candidate of candidateCodecs) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec: candidate.codecString,
          width,
          height,
          bitrate: (bitrateMbps || 30) * 1_000_000,
          framerate: fps,
        });
        if (support && support.supported) {
          selectedConfig = candidate;
          break;
        }
      } catch {
        // test next
      }
    }

    if (!selectedConfig) {
      selectedConfig = {
        codecString: width >= 3840 ? 'avc1.640033' : 'avc1.4d002a',
        muxerCodec: 'avc',
      };
    }

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: selectedConfig.muxerCodec,
        width,
        height,
      },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'strict',
    });

    let encoderError: Error | null = null;

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => {
        try {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);

          const durationMicros = chunk.duration && chunk.duration > 0 ? chunk.duration : frameDurationMicros;

          muxer.addVideoChunkRaw(
            data,
            chunk.type,
            chunk.timestamp,
            durationMicros,
            meta
          );
        } catch (e: any) {
          encoderError = e;
          console.error('Muxer chunk error:', e);
        }
      },
      error: (e) => {
        encoderError = e;
        console.error('VideoEncoder error:', e);
      },
    });

    await videoEncoder.configure({
      codec: selectedConfig.codecString,
      width,
      height,
      bitrate: (bitrateMbps || 30) * 1_000_000,
      framerate: fps,
      hardwareAcceleration: 'prefer-hardware',
    });

    const startTime = performance.now();

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        videoEncoder.close();
        throw new Error('Export cancelled by user');
      }

      if (encoderError) {
        throw encoderError;
      }

      const currentTime = frameIndex / fps;

      // 1. Await any HTML video elements to seek and decode
      await this.prepareVideoLayers(exportLayers, currentTime);

      // 2. Render frame deterministically at exact fractional second
      renderFrame({
        ctx,
        canvasSettings: scaledCanvasSettings,
        layers: exportLayers,
        currentTime,
        selectedLayerIds: [],
        showGizmos: false,
        showSafeAreas: false,
      });

      const timestampMicros = Math.round(frameIndex * frameDurationMicros);
      const videoFrame = new VideoFrame(renderCanvas, {
        timestamp: timestampMicros,
        duration: frameDurationMicros,
      });

      const isKeyFrame = frameIndex % Math.min(30, fps) === 0;
      videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();

      // 3. Prevent queue buildup to avoid dropping frames or silent OOMs
      while (videoEncoder.encodeQueueSize > 4) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
      
      // 4. Yield event loop occasionally to update UI smoothly
      if (frameIndex % 8 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

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

    return new Blob([target.buffer], { type: 'video/mp4' });
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

    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
      ? 'video/mp4;codecs=avc1'
      : MediaRecorder.isTypeSupported('video/mp4')
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

    const recordPromise = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      };
      recorder.onerror = (e) => reject(e);
    });

    recorder.start();

    const startTime = performance.now();
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Export cancelled by user');
      }

      const currentTime = frameIndex / fps;
      
      await this.prepareVideoLayers(exportLayers, currentTime);
      
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
