import { useEffect, useRef, useState, useCallback } from 'react';
import { AirCanvas } from './systems/airCanvasSystem';
import { Toolbar } from './components/Toolbar';
import { ColorPalette } from './components/ColorPalette';
import { GestureHints } from './components/GestureHints';
import { CameraPreview } from './components/CameraPreview';
import { COLOR_ARRAY } from './utils/constants';

function App() {
    const canvasRef = useRef<AirCanvas | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [activeColor, setActiveColor] = useState(COLOR_ARRAY[0]);

    useEffect(() => {
        // Initialize AirCanvas system
        if (!canvasRef.current) {
            console.log("Initializing AirCanvas System...");
            try {
                canvasRef.current = new AirCanvas();
                setLoaded(true);
            } catch (e) {
                console.error("Failed to initialize AirCanvas:", e);
            }
        }

        return () => {
            if (canvasRef.current) {
                canvasRef.current.cleanup();
                canvasRef.current = null;
            }
        };
    }, []);

    const handleClear = useCallback(() => {
        canvasRef.current?.clear();
    }, []);

    const handleUndo = useCallback(() => {
        canvasRef.current?.undo();
    }, []);

    const handleInvite = useCallback(() => {
        const code = canvasRef.current?.inviteFriend();
        if (code) alert(`Room Code: ${code}`);
    }, []);

    const handleColorSelect = useCallback((color: string) => {
        setActiveColor(color);
        canvasRef.current?.setColor(color);
    }, []);

    return (
        <div className="content-wrapper">
            {/* 3D Scene */}
            <div id="scene-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></div>
            <canvas id="scene-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></canvas>

            {/* Drawing & Hand Layers */}
            <canvas id="draw-canvas" width={window.innerWidth} height={window.innerHeight} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}></canvas>
            <canvas id="hand-canvas" width={window.innerWidth} height={window.innerHeight} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }}></canvas>

            {/* Camera Preview */}
            <div className={loaded ? '' : 'hidden'}>
                <CameraPreview />
            </div>

            {/* UI Overlay */}
            <div id="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 4, pointerEvents: 'none' }}>
                <div className="title-section">
                    <h1 className="title-text">Air Canvas</h1>
                    <p className="subtitle-text">Gesture Drawing System</p>
                </div>

                <div className="gesture-hints">
                    <GestureHints />
                </div>

                <Toolbar
                    onClear={handleClear}
                    onUndo={handleUndo}
                    onInvite={handleInvite}
                />

                <ColorPalette
                    activeColor={activeColor}
                    onSelectColor={handleColorSelect}
                />
            </div>
        </div>
    );
}

export default App;
