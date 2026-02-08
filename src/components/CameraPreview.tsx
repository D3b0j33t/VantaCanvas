import React, { useState } from 'react';

export const CameraPreview: React.FC = () => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <div id="camera-preview" className={expanded ? 'expanded' : ''} style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            width: expanded ? '640px' : '240px',
            height: expanded ? '480px' : '180px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid rgba(232, 186, 255, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            transition: 'all 0.3s ease',
            pointerEvents: 'auto'
        }}>
            <button className="preview-expand-btn" onClick={toggleExpand} style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 11
            }}>
                {expanded ? '↙️' : '↗️'}
            </button>
            <video id="webcam" autoPlay playsInline muted style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
            }}></video>
            <canvas id="preview-canvas" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}></canvas>
        </div>
    );
};
