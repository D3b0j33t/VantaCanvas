import React from 'react';
import { COLOR_ARRAY } from '../utils/constants';

interface ColorPaletteProps {
    activeColor: string;
    onSelectColor: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ activeColor, onSelectColor }) => {
    const colors = COLOR_ARRAY;

    return (
        <div className="color-palette" style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            padding: '10px 14px',
            background: 'rgba(40, 20, 40, 0.8)',
            borderRadius: '30px',
            border: '1px solid rgba(232, 186, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto'
        }}>
            {colors.map((color) => (
                <div
                    key={color}
                    onClick={() => onSelectColor(color)}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: `2px solid ${activeColor === color ? color : 'transparent'}`,
                        backgroundColor: color,
                        transform: activeColor === color ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: activeColor === color ? '0 0 15px rgba(232, 186, 255, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                />
            ))}
        </div>
    );
};
