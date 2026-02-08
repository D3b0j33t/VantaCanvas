# AirCanvas Architecture

## Overview
AirCanvas uses a hybrid architecture combining **React** for the UI layer and persistent **Systems** for the core 3D and computer vision logic.

## Directory Structure (!Important)

```text
src/
├── components/       # React UI components (Toolbar, Palette, etc.)
├── systems/          # Core Application Logic (Non-React)
│   ├── AirCanvasSystem.ts  # Main orchestrator
│   ├── Scene3D.ts          # Three.js scene management
│   ├── ObjectManager.ts    # Manages 3D balloons
│   ├── HandTracking.ts     # MediaPipe integration
│   ├── GestureDetector.ts  # Gesture recognition logic
│   └── ...
├── utils/            # Shared utilities
│   ├── constants.ts        # Configuration and magic numbers
│   ├── types.ts            # TypeScript interfaces
├── App.tsx           # Main React component & System Bridge
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Core Systems

### React Layer (`src/components/` & `App.tsx`)
-   **Responsibility**: Renders the UI overlay, manages application state (active color, tool), and handles user input events (clicks).
-   **Bridge**: `App.tsx` initializes `AirCanvasSystem` using a `useRef` hook. It bridges React state (e.g., color selection) to the system via method calls (e.g., `system.setColor()`).

### Systems Layer (`src/systems/`)
-   **AirCanvasSystem**: The singleton-like class that ties everything together. It runs the animation loop, manages the 3D scene, and handles hand tracking updates.
-   **Scene3D**: Wrapper around Three.js scene, camera, and renderer.
-   **ObjectManager**: Handles creation, deletion, and manipulation of 3D objects (balloons).
-   **GestureDetector**: Stateless logic that analyzes hand landmarks to determine gestures (Pinch, Draw, etc.).

## Data Flow
1.  **HandTracking** captures webcam frame -> **Landmarks**.
2.  **AirCanvasSystem** sends landmarks to **GestureDetector**.
3.  **GestureDetector** returns a **GestureState** (e.g., "Pinch").
4.  **AirCanvasSystem** acts on state:
    -   If *Draw*: Updates **DrawingCanvas**.
    -   If *Pinch*: Calls **ObjectManager** to move objects.
5.  **Scene3D** renders the 3D world.
6.  **React UI** updates purely for visual feedback (e.g., highlighting active color).
