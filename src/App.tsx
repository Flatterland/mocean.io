import React, { useEffect } from 'react';
import { TopNav } from './components/header/TopNav';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { Viewport } from './components/stage/Viewport';
import { RightInspector } from './components/inspector/RightInspector';
import { Timeline } from './components/timeline/Timeline';
import { ExportModal } from './components/modals/ExportModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { useProjectStore } from './store/projectStore';

export function App() {
  const {
    togglePlay,
    undo,
    redo,
    selectedLayerIds,
    deleteLayers,
    duplicateLayers,
    splitLayerAtPlayhead,
    setExportModalOpen,
  } = useProjectStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut when typing in inputs / textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space: Toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      // Ctrl+Z: Undo
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }
      // Delete / Backspace: Delete selected
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          deleteLayers(selectedLayerIds);
        }
      }
      // Ctrl+D: Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          duplicateLayers(selectedLayerIds);
        }
      }
      // S: Split layer at playhead
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          splitLayerAtPlayhead(selectedLayerIds[0]);
        }
      }
      // Ctrl+E: Open 4K Export Modal
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds, togglePlay, undo, redo, deleteLayers, duplicateLayers, splitLayerAtPlayhead, setExportModalOpen]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090a0f] text-slate-100 overflow-hidden select-none font-sans">
      {/* 1. Top Navigation Bar */}
      <TopNav />

      {/* 2. Middle Main Workspace (Left Sidebar + Center Canvas Viewport + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <Viewport />
        <RightInspector />
      </div>

      {/* 3. Bottom Multi-Track Timeline */}
      <Timeline />

      {/* Modals */}
      <ExportModal />
      <SettingsModal />
      <TemplatesModal />
    </div>
  );
}

export default App;
