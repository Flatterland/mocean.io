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
    workspace,
    togglePlay,
    shuttleForward,
    shuttleReverse,
    shuttlePause,
    undo,
    redo,
    selectedLayerIds,
    deleteLayers,
    duplicateLayers,
    splitLayerAtPlayhead,
    setExportModalOpen,
    setActiveTool,
    setMarkIn,
    setMarkOut,
  } = useProjectStore();

  // Premiere-like Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space: Toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      // Premiere J-K-L Shuttle Controls
      else if (e.key.toLowerCase() === 'j' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shuttleReverse();
      }
      else if (e.key.toLowerCase() === 'k' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shuttlePause();
      }
      else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shuttleForward();
      }
      // Premiere Tool Selection: V, C, H, Z
      else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('select');
      }
      else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('razor');
      }
      else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('hand');
      }
      else if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('zoom');
      }
      // In/Out Marking: I, O
      else if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setMarkIn();
      }
      else if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setMarkOut();
      }
      // Ctrl+K or S: Split layer at playhead
      else if (
        (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          splitLayerAtPlayhead(selectedLayerIds[0]);
        }
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
      // Delete / Backspace
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
      // Ctrl+E: Open 4K Export Modal
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedLayerIds,
    togglePlay,
    shuttleForward,
    shuttleReverse,
    shuttlePause,
    undo,
    redo,
    deleteLayers,
    duplicateLayers,
    splitLayerAtPlayhead,
    setExportModalOpen,
    setActiveTool,
    setMarkIn,
    setMarkOut,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090a0f] text-slate-100 overflow-hidden select-none font-sans">
      <TopNav />

      {/* Main Workspace Area with dynamic workspace layout responsiveness */}
      <div className="flex-1 flex overflow-hidden">
        {workspace !== 'minimal' && <LeftSidebar />}
        <Viewport />
        {workspace !== 'minimal' && <RightInspector />}
      </div>

      <Timeline />

      <ExportModal />
      <SettingsModal />
      <TemplatesModal />
    </div>
  );
}

export default App;
