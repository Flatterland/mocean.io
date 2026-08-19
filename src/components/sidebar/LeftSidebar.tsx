import React, { useState } from 'react';
import { Type, Shapes, Sparkles, Image as ImageIcon, Layers, LayoutTemplate } from 'lucide-react';
import { TextTab } from './TextTab';
import { ShapesTab } from './ShapesTab';
import { PresetsTab } from './PresetsTab';
import { MediaTab } from './MediaTab';
import { LayersTab } from './LayersTab';

type SidebarTab = 'text' | 'shapes' | 'presets' | 'media' | 'layers';

export const LeftSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('text');

  const navItems = [
    { id: 'text', label: 'Text', icon: <Type className="w-5 h-5" /> },
    { id: 'shapes', label: 'Shapes', icon: <Shapes className="w-5 h-5" /> },
    { id: 'presets', label: 'Presets', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
    { id: 'media', label: 'Media', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-80 bg-[#11131a] border-r border-[#222734] flex flex-row select-none z-20 shrink-0">
      {/* Mini Icon Rail */}
      <nav className="w-16 bg-[#0d0e14] border-r border-[#222734] flex flex-col items-center py-3 gap-2 shrink-0">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SidebarTab)}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181b24]'
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r" />
              )}
              {item.icon}
              <span className="text-[9px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Drawer Content */}
      <div className="flex-1 bg-[#11131a] overflow-hidden flex flex-col">
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'shapes' && <ShapesTab />}
        {activeTab === 'presets' && <PresetsTab />}
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'layers' && <LayersTab />}
      </div>
    </aside>
  );
};
