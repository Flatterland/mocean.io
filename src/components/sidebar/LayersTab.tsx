import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, Copy, Type, Square, Image as ImageIcon } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

export const LayersTab: React.FC = () => {
  const {
    layers,
    selectedLayerIds,
    selectLayer,
    updateLayer,
    deleteLayers,
    duplicateLayers,
  } = useProjectStore();

  // Reverse display so top of list = topmost z-index (highest trackIndex)
  const sortedLayers = [...layers].sort((a, b) => b.trackIndex - a.trackIndex);

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scene Layers ({layers.length})</span>
          </h3>
        </div>

        {selectedLayerIds.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => duplicateLayers(selectedLayerIds)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1f2330] rounded"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteLayers(selectedLayerIds)}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-[#1f2330] rounded"
              title="Delete (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {sortedLayers.map((layer) => {
          const isSelected = selectedLayerIds.includes(layer.id);

          return (
            <div
              key={layer.id}
              onClick={(e) => selectLayer(layer.id, e.shiftKey || e.ctrlKey || e.metaKey)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-sm'
                  : 'bg-[#181b24] hover:bg-[#1f2330] border-[#222734]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-slate-400">
                  {layer.type === 'text' && <Type className="w-4 h-4 text-indigo-400" />}
                  {layer.type === 'shape' && <Square className="w-4 h-4 text-pink-400" />}
                  {layer.type === 'image' && <ImageIcon className="w-4 h-4 text-cyan-400" />}
                </div>

                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-200 block truncate">
                    {layer.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {layer.animations.inPreset || 'static'} • {layer.startTime.toFixed(1)}s - {layer.endTime.toFixed(1)}s
                  </span>
                </div>
              </div>

              {/* Action toggles */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className={`p-1 rounded hover:bg-slate-700/50 ${
                    layer.visible ? 'text-slate-400' : 'text-slate-600'
                  }`}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className={`p-1 rounded hover:bg-slate-700/50 ${
                    layer.locked ? 'text-amber-400' : 'text-slate-600'
                  }`}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
