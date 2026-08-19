# 🌊 Mocean.io — Instant Motion Graphics Studio

> **Create beautiful kinetic text, animated vectors, and image motion graphics in seconds.**  
> Zero keyframe stress, effortless motion presets, multi-track timeline, and deterministic **4K 30FPS H.264 video export**.

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![4K Export](https://img.shields.io/badge/Export-4K_H.264_MP4-10B981?style=flat&logo=google-chrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)

---

## ✨ Features

- ⚡ **Zero-Friction Kinetic Presets**:
  - **Entrances (In)**: *Kinetic Pop*, *Typewriter Cursor*, *Word Stagger Rise*, *Letter Spring Bounce*, *Cinematic Blur In*, *Cyber Glitch Reveal*, *3D Flip Drop*, *Mask Wipe*, and *Elastic Zoom Boom*.
  - **Continuous Loops**: *Breathing Pulse*, *Neon Glow Pulse*, *Floating Hover*, *Kinetic Letter Wave*, and *Gradient Shimmer*.
  - **Exits (Out)**: *Sink & Fade Out*, *Vaporize Blur Out*, *Elastic Shrink*, and *Glitch Vanish*.
- 🎞️ **Pro Multi-Track Timeline**:
  - Independent tracks for text, shapes, and media.
  - Interactive edge-trimming, drag-to-move, magnetic snapping, and split at playhead (`S`).
  - Visual motion preset badges directly on clip bars.
- 🎯 **Interactive Canvas Viewport**:
  - Direct layer dragging, rotation knobs, multi-handle resizing, and center snapping guidelines.
  - Action Safe & Title Safe guide overlays.
  - Presets for 4K 16:9, 4K 9:16 Vertical (TikTok/Reels/Shorts), 1080p, and 1:1 Square.
- 🚀 **Hardware-Accelerated 4K H.264 Video Export**:
  - Powered by WebCodecs `VideoEncoder` + `mp4-muxer` for deterministic frame-accurate rendering without dropped frames.
  - Real-time offscreen canvas preview, FPS encoding speed, and progress gauge.
- 🎨 **Templates & Asset Library**:
  - Pre-built motion projects (*Kinetic Typography Promo*, *Cyber Glitch Title*, *9:16 Social Reel Hook*, and *Editorial Minimalist Reveal*).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause playback |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `S` | Split selected layer at playhead |
| `Delete` / `Backspace` | Delete selected layer(s) |
| `Ctrl + D` | Duplicate selected layer(s) |
| `Ctrl + E` | Open 4K Export modal |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/mocean.io.git
cd mocean.io

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🌐 Deployment

### GitHub Pages (Automated)
This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. When you push to `main`, it will automatically build and deploy to GitHub Pages.

To activate:
1. Go to **Settings** > **Pages** in your GitHub repository.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.

### Vercel / Netlify
Connect this GitHub repository to Vercel or Netlify with default Vite build settings (`npm run build` with output directory `dist`).

---

## 📄 License
MIT License
