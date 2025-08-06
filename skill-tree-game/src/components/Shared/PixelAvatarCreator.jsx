import React, { useState } from 'react';

const PixelAvatarCreator = ({ onAvatarChange, initialAvatar }) => {
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [avatar, setAvatar] = useState(initialAvatar || {
    emoji: '🎮',
    color1: '#3b82f6',
    color2: '#1e40af'
  });

  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#64748b', '#000000', '#ffffff'
  ];

  const emojis = [
    '🎮', '🚀', '🌟', '⚡', '🔥', '💎', '🎯', '🏆',
    '🎨', '🔧', '💻', '🎵', '🌈', '⭐', '💫', '🎪'
  ];

  const updateAvatar = (updates) => {
    const newAvatar = { ...avatar, ...updates };
    setAvatar(newAvatar);
    onAvatarChange(newAvatar);
  };

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      background: '#f9fafb'
    }}>
      {/* Preview */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto',
          background: `linear-gradient(45deg, ${avatar.color1}, ${avatar.color2})`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          {avatar.emoji}
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Your Avatar Preview
        </div>
      </div>

      {/* Emoji Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          Choose Icon:
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '4px'
        }}>
          {emojis.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => updateAvatar({ emoji })}
              style={{
                width: '40px',
                height: '40px',
                border: avatar.emoji === emoji ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '4px',
                background: avatar.emoji === emoji ? '#eff6ff' : 'white',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selector */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          Choose Colors:
        </label>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              marginBottom: '4px',
              color: '#6b7280'
            }}>
              Primary
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: avatar.color1,
                borderRadius: '4px',
                border: '2px solid #d1d5db',
                cursor: 'pointer'
              }}
              onClick={() => updateAvatar({ color1: selectedColor })}
            />
          </div>
          
          <div>
            <div style={{
              fontSize: '12px',
              marginBottom: '4px',
              color: '#6b7280'
            }}>
              Secondary
            </div>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: avatar.color2,
                borderRadius: '4px',
                border: '2px solid #d1d5db',
                cursor: 'pointer'
              }}
              onClick={() => updateAvatar({ color2: selectedColor })}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px'
        }}>
          {colors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              style={{
                width: '32px',
                height: '32px',
                background: color,
                border: selectedColor === color ? '3px solid #000' : '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        Select a color, then click Primary or Secondary above to apply
      </div>
    </div>
  );
};

export default PixelAvatarCreator;