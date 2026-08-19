import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

const SAMPLE_MEDIA = [
  {
    name: 'Neon Cyber Grid',
    src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cosmic Nebula Glow',
    src: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Minimal Gradient Wave',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: '3D Chrome Sphere',
    src: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
  },
];

export const MediaTab: React.FC = () => {
  const { addImageLayer } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        addImageLayer(src, file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload & Sample Media</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Upload transparent PNGs, SVG logos, or motion graphics backdrops.
        </p>
      </div>

      {/* Upload Button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-4 border-2 border-dashed border-[#222734] hover:border-indigo-500/80 rounded-xl bg-[#181b24]/60 hover:bg-[#181b24] flex flex-col items-center justify-center gap-2 transition-all text-slate-400 hover:text-slate-200"
      >
        <Upload className="w-5 h-5 text-indigo-400" />
        <span className="text-xs font-medium">Upload Image or SVG</span>
        <span className="text-[10px] text-slate-500">PNG, JPG, SVG, WebP up to 4K</span>
      </button>

      {/* Sample media library */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Sample Assets
        </span>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_MEDIA.map((item, i) => (
            <button
              key={i}
              onClick={() => addImageLayer(item.src, item.name)}
              className="group relative rounded-lg overflow-hidden border border-[#222734] hover:border-cyan-500 transition-all aspect-video text-left"
            >
              <img
                src={item.src}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] font-medium text-white line-clamp-1">
                  {item.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
