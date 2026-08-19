import { create } from 'zustand';
import { CanvasSettings, ResolutionPreset, RESOLUTION_PRESETS } from '../types/project';
import { Layer, ShapeType, TextProperties, LayerStyle } from '../types/layer';
import { MotionPresetType } from '../types/animation';
import { PROJECT_TEMPLATES } from '../templates/projectTemplates';

interface ProjectState {
  // Project settings
  projectName: string;
  canvas: CanvasSettings;
  layers: Layer[];
  selectedLayerIds: string[];

  // Playhead & playback
  currentTime: number;
  isPlaying: boolean;
  isLooping: boolean;
  zoom: number; // timeline pixels per second
  timelineScrollLeft: number;

  // Viewport
  viewportZoom: number; // 0.2 to 3.0
  viewportPan: { x: number; y: number };
  showSafeAreas: boolean;
  showGrid: boolean;

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

  // Playhead actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setIsLooping: (looping: boolean) => void;
  setZoom: (zoom: number) => void;
  setTimelineScrollLeft: (scroll: number) => void;

  // Viewport actions
  setViewportZoom: (zoom: number) => void;
  setViewportPan: (pan: { x: number; y: number }) => void;
  toggleSafeAreas: () => void;
  toggleGrid: () => void;

  // Selection actions
  setSelectedLayerIds: (ids: string[]) => void;
  selectLayer: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;

  // Layer CRUD
  addTextLayer: (customText?: string, preset?: MotionPresetType) => Layer;
  addShapeLayer: (shapeType: ShapeType, preset?: MotionPresetType) => Layer;
  addImageLayer: (src: string, name?: string) => Layer;
  updateLayer: (id: string, updates: Partial<Layer> | ((prev: Layer) => Partial<Layer>)) => void;
  deleteLayers: (ids: string[]) => void;
  duplicateLayers: (ids: string[]) => void;
  splitLayerAtPlayhead: (id: string) => void;
  reorderLayerTrack: (layerId: string, newTrackIndex: number) => void;
  alignSelectedLayers: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;

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

const DEFAULT_CANVAS: CanvasSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 5.0,
  backgroundColor: '#090a0f',
  aspectRatio: '16:9',
  preset: '1080p',
};

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

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: 'Untitled Motion',
  canvas: { ...PROJECT_TEMPLATES[0].canvas },
  layers: JSON.parse(JSON.stringify(PROJECT_TEMPLATES[0].layers)),
  selectedLayerIds: [PROJECT_TEMPLATES[0].layers[1].id],

  currentTime: 1.2,
  isPlaying: false,
  isLooping: true,
  zoom: 120, // 120px per second
  timelineScrollLeft: 0,

  viewportZoom: 0.7,
  viewportPan: { x: 0, y: 0 },
  showSafeAreas: false,
  showGrid: true,

  history: [{ layers: JSON.parse(JSON.stringify(PROJECT_TEMPLATES[0].layers)), canvas: { ...PROJECT_TEMPLATES[0].canvas } }],
  historyIndex: 0,

  isExportModalOpen: false,
  isSettingsModalOpen: false,
  isTemplatesModalOpen: false,

  setProjectName: (name) => set({ projectName: name }),

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

  setCurrentTime: (time) => {
    const { canvas } = get();
    const clamped = Math.max(0, Math.min(canvas.duration, time));
    set({ currentTime: clamped });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsLooping: (looping) => set({ isLooping: looping }),
  setZoom: (zoom) => set({ zoom: Math.max(40, Math.min(400, zoom)) }),
  setTimelineScrollLeft: (scroll) => set({ timelineScrollLeft: scroll }),

  setViewportZoom: (zoom) => set({ viewportZoom: Math.max(0.1, Math.min(4, zoom)) }),
  setViewportPan: (pan) => set({ viewportPan: pan }),
  toggleSafeAreas: () => set((state) => ({ showSafeAreas: !state.showSafeAreas })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

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
        fontFamily: 'Montserrat',
        fontSize: 64,
        fontWeight: '800',
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

  splitLayerAtPlayhead: (id) => {
    const { currentTime, layers } = get();
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;

    if (currentTime <= layer.startTime + 0.1 || currentTime >= layer.endTime - 0.1) return;

    get().saveHistory();

    const originalEnd = layer.endTime;
    const splitId = `${layer.type}-${Date.now()}`;

    const part2: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: splitId,
      name: `${layer.name} (Part 2)`,
      startTime: currentTime,
      endTime: originalEnd,
      trackIndex: layers.length,
    };

    set((state) => ({
      layers: [
        ...state.layers.map((l) => (l.id === id ? { ...l, endTime: currentTime } : l)),
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
    const { canvas, selectedLayerIds, layers } = get();
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
