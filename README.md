# AirCanvas - Innovative Gesture Drawing

![AirCanvas Preview](https://i.imgur.com/your-preview-image.png) <!-- Consider adding a screenshot if available -->

Welcome to **AirCanvas**, a cutting-edge application that transforms your hand gestures into 3D art. Draw in the air using just your webcam, and watch your creations inflate into soft, floating 3D balloons.

**Experience it live:** [https://debojeet-aircanvas.vercel.app/](https://debojeet-aircanvas.vercel.app/)

## ✨ Key Features

-   **👆 Gesture Control**: Draw with your index finger, grab with a pinch, and inflate with an open palm.
-   **🎈 3D Inflation**: Unique algorithm turns 2D strokes into puffy 3D meshes with organic textures.
-   **✨ Particle Effects**: Dazzling particle trails follow your movements for a magical feel.
-   **↩️ Undo/Redo**: Made a mistake? Easily undo your last action.
-   **🎨 Expanded Palette**: Choose from 12 beautiful pastel colors.
-   **🤝 Multiplayer Ready**: Share a room code to draw with friends in real-time.
-   **📱 Responsive & Cross-Platform**: Works on web, desktop (Windows/Mac/Linux), tablet, and mobile.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v16+)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Debojeet-Bhowmick/AirCanvas.git
    cd AirCanvas
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server**
    -   **Web**:
        ```bash
        npm run dev
        ```
    -   **Desktop (Electron)**:
        ```bash
        npm run electron:dev
        ```

4.  Open your browser to the local URL (usually `http://localhost:5173`) if running web version. Electron will open a new window automatically.

## 📦 Building for Production

### Web
```bash
npm run build
```
Output: `dist/`

### Desktop (Electron)
```bash
npm run electron:build
```
Output: `release/` (Contains installers for your OS)

## 🎮 Controls

| Gesture | Action |
| :--- | :--- |
| **Point (Index)** | Draw lines in 3D space |
| **Pinch (Index+Thumb)** | Grab, move, and rotate objects |
| **Open Palm (Hold)** | Inflate current drawing into a balloon |
| **Fist (Hold)** | Clear all objects (alternative to button) |

| UI Button | Action |
| :--- | :--- |
| **Undo** | Remove the last created object |
| **Clear All** | Remove everything from the scene |
| **Invite Friend** | Generate a room code for multiplayer |

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, HTML5, CSS3 (Glassmorphism UI)
-   **Desktop Framework**: Electron, Vite Plugin Electron
-   **3D Rendering**: Three.js
-   **Computer Vision**: MediaPipe Hands
-   **Animation**: GSAP (GreenSock)
-   **Build Tool**: Vite, Electron Builder

## � Project Structure

```text
src/
├── components/       # React UI components
├── systems/          # Core Logic (Three.js, MediaPipe)
├── utils/            # Shared Types and Constants
├── App.tsx           # Main React App
└── main.tsx          # Entry Point
```

For a detailed deep-dive, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## �👨‍💻 Credits

**Designed & Developed by [Debojeet Bhowmick](https://debojeet-bhowmick.netlify.app/)**

Debojeet is a passionate Full Stack Developer, Entrepreneur, and Founder of **DEWizards Pvt. Ltd.** He specializes in crafting innovative digital experiences, automation, and AI-driven solutions.

-   **Portfolio**: [debojeet-bhowmick.netlify.app](https://debojeet-bhowmick.netlify.app/)


## 📄 License

**Restricted License**

Copyright (c) 2026 Debojeet Bhowmick. All rights reserved.

This project is licensed for personal, non-commercial use only. Redistribution, modification, or commercial usage is strictly prohibited without prior written consent from the author. See the [LICENSE](./LICENSE) file for details.
