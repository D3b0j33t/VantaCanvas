# AirCanvas - Technical Documentation

## 1. Overview

AirCanvas is a real-time gesture-based drawing application. It leverages computer vision (MediaPipe) to track hand landmarks and translates them into interactions within a 3D environment (Three.js).

## 2. Architecture

The application follows a modular architecture:

-   **Main Entry (`main.ts`)**: Orchestrates the application loop, initializing components and handling the render cycle.
-   **Input Layer**:
    -   `handTracking.ts`: Wraps MediaPipe Hands to provide landmark data.
    -   `gestureDetector.ts`: Analyzes landmarks to detect semantic gestures (Draw, Pinch, Palm).
-   **Logic Layer**:
    -   `drawingCanvas.ts`: Manages the 2D drawing feedback (lines on screen).
    -   `balloonInflator.ts`: Converts 2D strokes into 3D meshes (`THREE.ExtrudeGeometry` with custom inflation logic).
    -   `objectManager.ts`: Manages the lifecycle, physics (collision, bobbing), and state of 3D objects.
    -   `multiplayer.ts`: Handles PeerJS connections for real-time collaboration.
-   **Presentation Layer**:
    -   `scene3D.ts`: Manages the Three.js scene, camera, and lighting.
    -   `particles.ts`: Renders visual effects using a 2D canvas overlay.

## 3. Key Components

### Gesture Detection (`gestureDetector.ts`)
Uses heuristic thresholds defined in `constants.ts` to identify gestures:
-   **Draw**: Index finger extended, others curled.
-   **Pinch**: Distance between thumb and index tip < `GESTURE.PINCH_THRESHOLD`.
-   **Palm**: All fingers extended.

### Balloon Inflation (`balloonInflator.ts`)
1.  SIMPLIFY: Reduces stroke points to a manageable count.
2.  EXTRUDE: Creates a base 3D shape using `THREE.ExtrudeGeometry`.
3.  INFLATE: Iterates through vertices, pushing them outward along their normals relative to the object center, creating a "puffy" look.

### Particle System (`particles.ts`)
A lightweight 2D physics system. Particles are emitted at the index finger position during drawing. They have:
-   Velocity & Gravity
-   Life/Alpha decay
-   Color matching the current stroke

## 4. Configuration

Key settings can be tweaked in `src/constants.ts`:

```typescript
export const GESTURE = {
  PINCH_THRESHOLD: 60,
  // ...
};

export const PARTICLES = {
  // ...
};
```

## 5. Deployment

The project is built with Vite.

**Build Command:**
```bash
npm run build
```

**Output:**
The build artifacts will be in the `dist/` directory, ready for deployment to Vercel, Netlify, or any static host.
