import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Sliders,
  LayoutTemplate,
  Sparkles,
  Ratio,
  Maximize2,
  LayoutDashboard,
  Film,
  Type,
  Maximize
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { RESOLUTION_PRESETS, ResolutionPreset, WorkspaceLayout } from '../../types/project';

const WORKSPACES: { id: WorkspaceLayout; name: string; icon: React.ReactNode }[] = [
  { id: 'default', name: 'Motion Studio', icon: <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" /> },
  { id: 'timeline', name: 'Timeline Focus', icon: <Film className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'typography', name: 'Typography & Design', icon: <Type className="w-3.5 h-3.5 text-pink-400" /> },
  { id: 'minimal', name: 'Minimal Preview', icon: <Maximize className="w-3.5 h-3.5 text-cyan-400" /> },
];

export const TopNav: React.FC = () => {
  const {
    projectName,
    setProjectName,
    canvas,
    setResolutionPreset,
    workspace,
    setWorkspace,
    undo,
    redo,
    historyIndex,
    history,
    setExportModalOpen,
    setSettingsModalOpen,
    setTemplatesModalOpen,
    viewportZoom,
    setViewportZoom,
  } = useProjectStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="h-14 bg-[#11131a] border-b border-[#222734] px-4 flex items-center justify-between select-none z-30 relative">
      {/* Left: Brand & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow-accent">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
            Mocean<span className="text-indigo-400">.io</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
            4K Studio
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-900 px-2 py-1 rounded text-sm text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all max-w-[180px]"
          title="Click to rename project"
        />
      </div>

      {/* Center: Workspaces, Resolution, Tools */}
      <div className="flex items-center gap-2.5">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#181b24] p-1 rounded-lg border border-[#222734]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded hover:bg-slate-700/50 transition-colors ${
              canUndo ? 'text-slate-300' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded hover:bg-slate-700/50 transition-colors ${
              canRedo ? 'text-slate-300' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Layout Selector */}
        <div className="flex items-center gap-1.5 bg-[#181b24] px-2.5 py-1 rounded-lg border border-[#222734] text-xs">
          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value as WorkspaceLayout)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {WORKSPACES.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-[#11131a] text-slate-200">
                Workspace: {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resolution Preset Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#181b24] px-2.5 py-1 rounded-lg border border-[#222734] text-xs">
          <Ratio className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={canvas.preset}
            onChange={(e) => setResolutionPreset(e.target.value as ResolutionPreset)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {Object.entries(RESOLUTION_PRESETS).map(([key, config]) => (
              <option key={key} value={key} className="bg-[#11131a] text-slate-200">
                {config.name} ({config.width}×{config.height})
              </option>
            ))}
          </select>
        </div>

        {/* Viewport Zoom */}
        <div className="flex items-center gap-1 bg-[#181b24] px-2 py-1 rounded-lg border border-[#222734] text-xs text-slate-300">
          <Maximize2 className="w-3 h-3 text-slate-400" />
          <span>{Math.round(viewportZoom * 100)}%</span>
          <button
            onClick={() => setViewportZoom(0.7)}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-1 font-mono"
            title="Reset Zoom"
          >
            Fit
          </button>
        </div>

        {/* Templates Button */}
        <button
          onClick={() => setTemplatesModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#181b24] hover:bg-[#222734] text-slate-200 px-3 py-1.5 rounded-lg border border-[#222734] text-xs font-medium transition-colors"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-pink-400" />
          <span>Templates</span>
        </button>
      </div>

      {/* Right: Settings & 4K Export */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#181b24] rounded-lg transition-colors border border-transparent hover:border-[#222734]"
          title="Canvas & FPS Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-glow-accent hover:shadow-lg transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export 4K Video</span>
        </button>
      </div>
    </header>
  );
};
