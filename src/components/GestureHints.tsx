import React from 'react';

export const GestureHints: React.FC = () => {
    return (
        <div className="gesture-hints" style={{
            position: 'absolute',
            bottom: '80px',
            left: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            opacity: 0.8,
            pointerEvents: 'none'
        }}>
            <div className="gesture-hint" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(232, 186, 255, 0.8)', fontSize: '12px' }}>
                <span className="gesture-icon">👆</span>
                <span>Point to Draw</span>
            </div>
            <div className="gesture-hint" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(232, 186, 255, 0.8)', fontSize: '12px' }}>
                <span className="gesture-icon">👌</span>
                <span>Pinch to Move</span>
            </div>
            <div className="gesture-hint" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(232, 186, 255, 0.8)', fontSize: '12px' }}>
                <span className="gesture-icon">✋</span>
                <span>Open Palm to Inflate</span>
            </div>
        </div>
    );
};
