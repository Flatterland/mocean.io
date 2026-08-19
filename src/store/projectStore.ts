import { create } from 'zustand';
import { CanvasSettings, ResolutionPreset, RESOLUTION_PRESETS, WorkspaceLayout, ActiveTool, StageMode, ThreeDViewSettings } from '../types/project';
import { Layer, ShapeType, TextProperties, LayerStyle, VideoProperties, MotionPathPoint } from '../types/layer';
import { MotionPresetType, AnimatableProperty, Keyframe, EasingType } from '../types/animation';
import { PROJECT_TEMPLATES } from '../templates/projectTemplates';

interface ProjectState {
  // Project settings
  projectName: string;
  canvas: CanvasSettings;
  layers: Layer[];
  selectedLayerIds: string[];

  // Workspace & Tools
  workspace: WorkspaceLayout;
  activeTool: ActiveTool;
  stageMode: StageMode;
  threeDConfig: ThreeDViewSettings;
  isRecordingMotionPath: boolean;
  recordingLayerId: string | null;

  // Playhead & playback
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number; // 1, 2, 4, -1, -2, -4 for J-K-L shuttle
  zoom: number; // timeline pixels per second
  timelineScrollLeft: number;

  // Viewport
  viewportZoom: number;
  viewportPan: { x: number; y: number };
  showSafeAreas: boolean;
  showGrid: boolean;
  showMinimap: boolean;

  // History for Undo/Redo
  history: { layers: Layer[]; canvas: CanvasSettings }[];
  historyIndex: number;

  // Modals
  isExportModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isTemplatesModalOpen: boolean;

  // Actions
  setProjectName: (name: string) => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  setResolutionPreset: (preset: ResolutionPreset) => void;
  setWorkspace: (ws: WorkspaceLayout) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setStageMode: (mode: StageMode) => void;
  setThreeDConfig: (config: Partial<ThreeDViewSettings>) => void;
  resetThreeDView: () => void;

  // Playhead & Shuttle actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setIsLooping: (looping: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  shuttleForward: () => void; // L key in Premiere
  shuttleReverse: () => void; // J key in Premiere
  shuttlePause: () => void;   // K key in Premiere
  setMarkIn: (time?: number) => void; // I key
  setMarkOut: (time?: number) => void; // O key
  setZoom: (zoom: number) => void;
  setTimelineScrollLeft: (scroll: number) => void;

  // Viewport actions
  setViewportZoom: (zoom: number) => void;
  setViewportPan: (pan: { x: number; y: number }) => void;
  toggleSafeAreas: () => void;
  toggleGrid: () => void;
  toggleMinimap: () => void;

  // Selection actions
  setSelectedLayerIds: (ids: string[]) => void;
  selectLayer: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;

  // Layer CRUD
  addTextLayer: (customText?: string, preset?: MotionPresetType) => Layer;
  addShapeLayer: (shapeType: ShapeType, preset?: MotionPresetType) => Layer;
  addImageLayer: (src: string, name?: string) => Layer;
  addVideoLayer: (src: string, name?: string) => Layer;
  updateLayer: (id: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => void;
  deleteLayers: (ids: string[]) => void;
  duplicateLayers: (ids: string[]) => void;
  splitLayerAtPlayhead: (id: string, splitTime?: number) => void;
  reorderLayerTrack: (layerId: string, newTrackIndex: number) => void;
  alignSelectedLayers: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

  // Keyframe Management
  addKeyframe: (layerId: string, property: AnimatableProperty, time: number, value: number, easing?: EasingType) => void;
  removeKeyframe: (layerId: string, property: AnimatableProperty, keyframeId: string) => void;

  // Mouse Path Recording
  startMotionPathRecording: (layerId: string) => void;
  addMotionPathPoint: (x: number, y: number, time: number) => void;
  finishMotionPathRecording: () => void;
  clearMotionPath: (layerId: string) => void;

  // Preset quick apply
  applyPresetToSelected: (presetId: MotionPresetType, category: 'in' | 'out' | 'loop') => void;

  // Templates
  loadTemplate: (templateId: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Modals
  setExportModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setTemplatesModalOpen: (open: boolean) => void;
}

const DEFAULT_STYLE: LayerStyle = {
  fill: '#ffffff',
  stroke: '',
  strokeWidth: 0,
  opacity: 1,
  blur: 0,
  shadowColor: 'transparent',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  blendMode: 'source-over',
};

const SAVED_WORKSPACE = (localStorage.getItem('mocean_workspace') as WorkspaceLayout) || 'default';

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Untitled Motion',
  canvas: { ...PROJECT_TEMPLATES[0].canvas },
  layers: JSON.parse(JSON.stringify(PROJECT_TEMPLATES[0].layers)),
  selectedLayerIds: [PROJECT_TEMPLATES[0].layers[1].id],

  workspace: SAVED_WORKSPACE,
  activeTool: 'select',
  stageMode: '2d',
  threeDConfig: {
    rotateX: 35,
    rotateY: -35,
    zoom: 0.8,
    panX: 0,
    panY: 0,
    layerSpacing: 70,
    perspective: 1200,
    projectionMode: 'perspective',
    showWireframes: true,
    showDepthLines: true,
    showLayerBadges: true,
    autoRotate: false,
  },
  isRecordingMotionPath: false,
  recordingLayerId: null,

  currentTime: 1.2,
  isPlaying: false,
  isLooping: true,
  playbackSpeed: 1,
  zoom: 120,
  timelineScrollLeft: 0,

  viewportZoom: 0.7,
  viewportPan: { x: 0, y: 0 },
  showSafeAreas: false,
  showGrid: true,
  showMinimap: true,

  history: [{ layers: JSON.parse(JSON.stringify(PROJECT_TEMPLATES[0].layers)), canvas: { ...PROJECT_TEMPLATES[0].canvas } }],
  historyIndex: 0,

  isExportModalOpen: false,
  isSettingsModalOpen: false,
  isTemplatesModalOpen: false,

  setProjectName: (name) => set({ projectName: name }),

  setStageMode: (mode) => set({ stageMode: mode }),
  setThreeDConfig: (config) =>
    set((state) => ({ threeDConfig: { ...state.threeDConfig, ...config } })),
  resetThreeDView: () =>
    set({
      threeDConfig: {
        rotateX: 35,
        rotateY: -35,
        zoom: 0.8,
        panX: 0,
        panY: 0,
        layerSpacing: 70,
        perspective: 1200,
        projectionMode: 'perspective',
        showWireframes: true,
        showDepthLines: true,
        showLayerBadges: true,
        autoRotate: false,
      },
    }),

  setCanvasSettings: (settings) => {
    get().saveHistory();
    set((state) => ({
      canvas: { ...state.canvas, ...settings },
    }));
  },

  setResolutionPreset: (preset) => {
    get().saveHistory();
    const config = RESOLUTION_PRESETS[preset];
    if (!config) return;
    set((state) => ({
      canvas: {
        ...state.canvas,
        preset,
        width: config.width,
        height: config.height,
        aspectRatio: config.aspectRatio,
      },
    }));
  },

  setWorkspace: (ws) => {
    localStorage.setItem('mocean_workspace', ws);
    set({ workspace: ws });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  setCurrentTime: (time) => {
    const { canvas } = get();
    const clamped = Math.max(0, Math.min(canvas.duration, time));
    set({ currentTime: clamped });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying, playbackSpeed: 1 })),
  setIsLooping: (looping) => set({ isLooping: looping }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  // Premiere Shuttle J-K-L Controls
  shuttleForward: () => {
    const { isPlaying, playbackSpeed } = get();
    if (!isPlaying) {
      set({ isPlaying: true, playbackSpeed: 1 });
    } else {
      const nextSpeed = playbackSpeed > 0 ? Math.min(4, playbackSpeed * 2) : 1;
      set({ playbackSpeed: nextSpeed });
    }
  },

  shuttleReverse: () => {
    const { isPlaying, playbackSpeed } = get();
    if (!isPlaying) {
      set({ isPlaying: true, playbackSpeed: -1 });
    } else {
      const nextSpeed = playbackSpeed < 0 ? Math.max(-4, playbackSpeed * 2) : -1;
      set({ playbackSpeed: nextSpeed });
    }
  },

  shuttlePause: () => {
    set({ isPlaying: false, playbackSpeed: 1 });
  },

  setMarkIn: (time) => {
    const { currentTime, canvas } = get();
    const mark = time !== undefined ? time : currentTime;
    set({ canvas: { ...canvas, markIn: mark } });
  },

  setMarkOut: (time) => {
    const { currentTime, canvas } = get();
    const mark = time !== undefined ? time : currentTime;
    set({ canvas: { ...canvas, markOut: mark } });
  },

  setZoom: (zoom) => set({ zoom: Math.max(40, Math.min(400, zoom)) }),
  setTimelineScrollLeft: (scroll) => set({ timelineScrollLeft: scroll }),

  setViewportZoom: (zoom) => set({ viewportZoom: Math.max(0.1, Math.min(4, zoom)) }),
  setViewportPan: (pan) => set({ viewportPan: pan }),
  toggleSafeAreas: () => set((state) => ({ showSafeAreas: !state.showSafeAreas })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),

  selectLayer: (id, multiSelect = false) => {
    set((state) => {
      if (multiSelect) {
        const exists = state.selectedLayerIds.includes(id);
        return {
          selectedLayerIds: exists
            ? state.selectedLayerIds.filter((item) => item !== id)
            : [...state.selectedLayerIds, id],
        };
      }
      return { selectedLayerIds: [id] };
    });
  },

  clearSelection: () => set({ selectedLayerIds: [] }),

  addTextLayer: (customText = 'KINETIC TEXT', preset = 'text_kinetic_pop') => {
    get().saveHistory();
    const { canvas, layers, currentTime } = get();
    const newId = `text-${Date.now()}`;
    const nextTrack = layers.length;

    const newLayer: Layer = {
      id: newId,
      name: customText.length > 18 ? `${customText.slice(0, 18)}...` : customText,
      type: 'text',
      visible: true,
      locked: false,
      startTime: Math.max(0, currentTime),
      endTime: Math.min(canvas.duration, currentTime + 3.5),
      trackIndex: nextTrack,
      transform: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 600,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      style: {
        ...DEFAULT_STYLE,
        fill: '#ffffff',
        shadowColor: 'rgba(99, 102, 241, 0.5)',
        shadowBlur: 20,
      },
      animations: {
        inPreset: preset,
        inDuration: 0.7,
        inStagger: 0.04,
        loopPreset: 'loop_breathing_pulse',
        loopSpeed: 1,
        loopIntensity: 1,
        outPreset: 'text_out_fade_down',
        outDuration: 0.5,
      },
      text: {
        text: customText,
        fontFamily: 'Lato',
        fontSize: 64,
        fontWeight: '900',
        fontStyle: 'normal',
        textAlign: 'center',
        letterSpacing: 2,
        lineHeight: 1.1,
        textTransform: 'uppercase',
        staggerUnit: 'character',
      },
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newId],
    }));

    return newLayer;
  },

  addShapeLayer: (shapeType: ShapeType, preset = 'shape_elastic_pop') => {
    get().saveHistory();
    const { canvas, layers, currentTime } = get();
    const newId = `shape-${Date.now()}`;
    const nextTrack = layers.length;

    const newLayer: Layer = {
      id: newId,
      name: `${shapeType.toUpperCase()} Shape`,
      type: 'shape',
      visible: true,
      locked: false,
      startTime: Math.max(0, currentTime),
      endTime: Math.min(canvas.duration, currentTime + 4.0),
      trackIndex: nextTrack,
      transform: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: shapeType === 'pill' ? 320 : 200,
        height: shapeType === 'pill' ? 80 : 200,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      style: {
        fill: '#6366f1',
        stroke: '#ffffff',
        strokeWidth: 2,
        opacity: 1,
        blur: 0,
        shadowColor: 'rgba(99, 102, 241, 0.6)',
        shadowBlur: 25,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        blendMode: 'source-over',
      },
      animations: {
        inPreset: preset,
        inDuration: 0.7,
        inStagger: 0,
        loopSpeed: 1,
        loopIntensity: 1,
        outPreset: 'text_out_elastic_shrink',
        outDuration: 0.4,
      },
      shape: {
        shapeType,
        cornerRadius: 24,
        points: 5,
        innerRadiusRatio: 0.4,
        closed: true,
      },
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newId],
    }));

    return newLayer;
  },

  addImageLayer: (src: string, name = 'Image Layer') => {
    get().saveHistory();
    const { canvas, layers, currentTime } = get();
    const newId = `image-${Date.now()}`;
    const nextTrack = layers.length;

    const newLayer: Layer = {
      id: newId,
      name,
      type: 'image',
      visible: true,
      locked: false,
      startTime: Math.max(0, currentTime),
      endTime: Math.min(canvas.duration, currentTime + 4.5),
      trackIndex: nextTrack,
      transform: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 400,
        height: 400,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      style: {
        ...DEFAULT_STYLE,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowBlur: 20,
      },
      animations: {
        inPreset: 'image_drop_bounce',
        inDuration: 0.8,
        inStagger: 0,
        loopPreset: 'image_ken_burns',
        loopSpeed: 1,
        loopIntensity: 1,
        outPreset: 'text_out_fade_down',
        outDuration: 0.5,
      },
      image: {
        src,
        originalWidth: 400,
        originalHeight: 400,
        aspectRatioLock: true,
        brightness: 1,
        contrast: 1,
        saturate: 1,
        hueRotate: 0,
      },
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newId],
    }));

    return newLayer;
  },

  addVideoLayer: (src: string, name = 'Video Layer') => {
    get().saveHistory();
    const { canvas, layers, currentTime } = get();
    const newId = `video-${Date.now()}`;
    const nextTrack = layers.length;

    const newLayer: Layer = {
      id: newId,
      name,
      type: 'video',
      visible: true,
      locked: false,
      startTime: Math.max(0, currentTime),
      endTime: Math.min(canvas.duration, currentTime + 5.0),
      trackIndex: nextTrack,
      transform: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 640,
        height: 360,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      style: {
        ...DEFAULT_STYLE,
        shadowColor: 'rgba(0,0,0,0.6)',
        shadowBlur: 25,
      },
      animations: {
        inDuration: 0.5,
        inStagger: 0,
        outDuration: 0.5,
        loopSpeed: 1,
        loopIntensity: 1,
      },
      video: {
        src,
        originalWidth: 640,
        originalHeight: 360,
        aspectRatioLock: true,
        volume: 1.0,
        muted: false,
        playbackRate: 1.0,
        trimStart: 0,
        trimEnd: 5.0,
      },
    };

    set((state) => ({
      layers: [...state.layers, newLayer],
      selectedLayerIds: [newId],
    }));

    return newLayer;
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== id) return l;
        const newProps = typeof updates === 'function' ? updates(l) : updates;
        return {
          ...l,
          ...newProps,
          transform: newProps.transform ? { ...l.transform, ...newProps.transform } : l.transform,
          style: newProps.style ? { ...l.style, ...newProps.style } : l.style,
          animations: newProps.animations ? { ...l.animations, ...newProps.animations } : l.animations,
          text: newProps.text && l.text ? { ...l.text, ...newProps.text } : (newProps.text || l.text),
          shape: newProps.shape && l.shape ? { ...l.shape, ...newProps.shape } : (newProps.shape || l.shape),
          image: newProps.image && l.image ? { ...l.image, ...newProps.image } : (newProps.image || l.image),
          video: newProps.video && l.video ? { ...l.video, ...newProps.video } : (newProps.video || l.video),
        };
      }),
    }));
  },

  deleteLayers: (ids) => {
    get().saveHistory();
    set((state) => ({
      layers: state.layers.filter((l) => !ids.includes(l.id)),
      selectedLayerIds: state.selectedLayerIds.filter((id) => !ids.includes(id)),
    }));
  },

  duplicateLayers: (ids) => {
    get().saveHistory();
    const { layers } = get();
    const newLayers: Layer[] = [];
    const newSelected: string[] = [];

    ids.forEach((id) => {
      const original = layers.find((l) => l.id === id);
      if (original) {
        const copyId = `${original.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const copy: Layer = {
          ...JSON.parse(JSON.stringify(original)),
          id: copyId,
          name: `${original.name} (Copy)`,
          trackIndex: layers.length + newLayers.length,
          transform: {
            ...original.transform,
            x: original.transform.x + 30,
            y: original.transform.y + 30,
          },
        };
        newLayers.push(copy);
        newSelected.push(copyId);
      }
    });

    set((state) => ({
      layers: [...state.layers, ...newLayers],
      selectedLayerIds: newSelected,
    }));
  },

  splitLayerAtPlayhead: (id, splitTime) => {
    const { currentTime, layers } = get();
    const targetTime = splitTime !== undefined ? splitTime : currentTime;
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;

    if (targetTime <= layer.startTime + 0.1 || targetTime >= layer.endTime - 0.1) return;

    get().saveHistory();

    const originalEnd = layer.endTime;
    const splitId = `${layer.type}-${Date.now()}`;

    const part2: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: splitId,
      name: `${layer.name} (Cut)`,
      startTime: targetTime,
      endTime: originalEnd,
      trackIndex: layers.length,
    };

    set((state) => ({
      layers: [
        ...state.layers.map((l) => (l.id === id ? { ...l, endTime: targetTime } : l)),
        part2,
      ],
      selectedLayerIds: [splitId],
    }));
  },

  reorderLayerTrack: (layerId, newTrackIndex) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === layerId ? { ...l, trackIndex: newTrackIndex } : l)),
    }));
  },

  alignSelectedLayers: (alignment) => {
    get().saveHistory();
    const { canvas, selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;

    set((state) => ({
      layers: state.layers.map((l) => {
        if (!selectedLayerIds.includes(l.id)) return l;
        const transform = { ...l.transform };

        switch (alignment) {
          case 'left':
            transform.x = transform.width / 2 + 100;
            break;
          case 'center':
            transform.x = canvas.width / 2;
            break;
          case 'right':
            transform.x = canvas.width - transform.width / 2 - 100;
            break;
          case 'top':
            transform.y = transform.height / 2 + 80;
            break;
          case 'middle':
            transform.y = canvas.height / 2;
            break;
          case 'bottom':
            transform.y = canvas.height - transform.height / 2 - 80;
            break;
        }

        return { ...l, transform };
      }),
    }));
  },

  // Keyframe Management
  addKeyframe: (layerId, property, time, value, easing = 'easeOutQuad') => {
    get().saveHistory();
    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== layerId) return l;

        const propertyTracks = l.animations.propertyTracks ? [...l.animations.propertyTracks] : [];
        let track = propertyTracks.find((t) => t.property === property);

        const newKf: Keyframe = {
          id: `kf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          time,
          value,
          easing,
        };

        if (!track) {
          track = { property, keyframes: [newKf] };
          propertyTracks.push(track);
        } else {
          // Replace existing at same timestamp or insert new
          const filtered = track.keyframes.filter((k) => Math.abs(k.time - time) > 0.05);
          track.keyframes = [...filtered, newKf].sort((a, b) => a.time - b.time);
        }

        return {
          ...l,
          animations: {
            ...l.animations,
            propertyTracks,
          },
        };
      }),
    }));
  },

  removeKeyframe: (layerId, property, keyframeId) => {
    get().saveHistory();
    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== layerId || !l.animations.propertyTracks) return l;

        const propertyTracks = l.animations.propertyTracks.map((t) => {
          if (t.property !== property) return t;
          return {
            ...t,
            keyframes: t.keyframes.filter((k) => k.id !== keyframeId),
          };
        });

        return {
          ...l,
          animations: {
            ...l.animations,
            propertyTracks,
          },
        };
      }),
    }));
  },

  // Mouse Motion Path Recording
  startMotionPathRecording: (layerId) => {
    set({
      isRecordingMotionPath: true,
      recordingLayerId: layerId,
      activeTool: 'motion-record',
    });
  },

  addMotionPathPoint: (x, y, time) => {
    const { recordingLayerId } = get();
    if (!recordingLayerId) return;

    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== recordingLayerId) return l;

        const existingPoints = l.animations.motionPath?.points || [];
        const newPoint: MotionPathPoint = { x: Math.round(x), y: Math.round(y), time };

        return {
          ...l,
          animations: {
            ...l.animations,
            motionPath: {
              points: [...existingPoints, newPoint],
              showPathTrail: true,
            },
          },
        };
      }),
    }));
  },

  finishMotionPathRecording: () => {
    get().saveHistory();
    set({
      isRecordingMotionPath: false,
      recordingLayerId: null,
      activeTool: 'select',
    });
  },

  clearMotionPath: (layerId) => {
    get().saveHistory();
    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          animations: {
            ...l.animations,
            motionPath: undefined,
          },
        };
      }),
    }));
  },

  applyPresetToSelected: (presetId, category) => {
    get().saveHistory();
    const { selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;

    set((state) => ({
      layers: state.layers.map((l) => {
        if (!selectedLayerIds.includes(l.id)) return l;
        const animations = { ...l.animations };
        if (category === 'in') animations.inPreset = presetId;
        else if (category === 'out') animations.outPreset = presetId;
        else if (category === 'loop') animations.loopPreset = presetId;

        return { ...l, animations };
      }),
    }));
  },

  loadTemplate: (templateId) => {
    get().saveHistory();
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    set({
      projectName: template.name,
      canvas: { ...template.canvas },
      layers: JSON.parse(JSON.stringify(template.layers)),
      selectedLayerIds: template.layers.length > 0 ? [template.layers[0].id] : [],
      currentTime: 1.0,
      isTemplatesModalOpen: false,
    });
  },

  saveHistory: () => {
    const { layers, canvas, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      layers: JSON.parse(JSON.stringify(layers)),
      canvas: JSON.parse(JSON.stringify(canvas)),
    });
    if (newHistory.length > 40) newHistory.shift();

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        layers: JSON.parse(JSON.stringify(prev.layers)),
        canvas: JSON.parse(JSON.stringify(prev.canvas)),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        layers: JSON.parse(JSON.stringify(next.layers)),
        canvas: JSON.parse(JSON.stringify(next.canvas)),
        historyIndex: historyIndex + 1,
      });
    }
  },

  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
  setTemplatesModalOpen: (open) => set({ isTemplatesModalOpen: open }),
}));
