import React from 'react';

interface ToolbarProps {
    onUndo: () => void;
    onClear: () => void;
    onInvite: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onClear, onInvite }) => {
    const btnStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(40, 20, 40, 0.8)',
        border: '1px solid rgba(232, 186, 255, 0.3)',
        borderRadius: '25px',
        color: '#e8baFF',
        fontFamily: '"Inter", sans-serif',
        fontSize: '13px',
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(10px)',
    };

    return (
        <div className="action-buttons" style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            display: 'flex',
            gap: '12px',
            zIndex: 11,
            pointerEvents: 'auto'
        }}>
            <button style={btnStyle} onClick={onClear}>
                <span style={{ fontSize: '16px' }}>🗑️</span>
                <span>Clear All</span>
            </button>
            <button style={btnStyle} onClick={onUndo}>
                <span style={{ fontSize: '16px' }}>↩️</span>
                <span>Undo</span>
            </button>
            <button style={btnStyle} onClick={onInvite}>
                <span style={{ fontSize: '16px' }}>👥</span>
                <span>Invite Friend</span>
            </button>
        </div>
    );
};
