import React, { useState } from 'react';

const TermsOfUse = ({ onAccept, onDecline, isVisible, title = "Terms of Use" }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    if (isAccepted && onAccept) {
      onAccept();
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        border: '3px solid #7c3aed'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            color: '#7c3aed',
            margin: '0 0 15px 0',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {title}
          </h2>
          
          <div style={{
            background: '#fef3cd',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'left',
            lineHeight: '1.6',
            color: '#92400e'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              <span style={{ marginRight: '8px', fontSize: '20px' }}>⚠️</span>
              Heads Up: Please do not share any personal data.
            </div>
            
            <div style={{ fontSize: '14px', marginBottom: '15px' }}>
              All conversations are stored and may be reviewed by TPZ staff and may be used for TPZ program research. 
              While this site isn't on search engines, it's accessible via the link. 
            </div>
            
            <div style={{ fontSize: '14px' }}>
              We encourage you to set a PIN and do not share it with anyone.
            </div>
          </div>
        </div>

        <div style={{
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '15px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <input
            type="checkbox"
            id="termsAcceptance"
            checked={isAccepted}
            onChange={(e) => setIsAccepted(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <label 
            htmlFor="termsAcceptance"
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              userSelect: 'none'
            }}
          >
            I understand and agree to these terms of use
          </label>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {onDecline && (
            <button
              onClick={handleDecline}
              style={{
                background: '#f3f4f6',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '12px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
              }}
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleAccept}
            disabled={!isAccepted}
            style={{
              background: isAccepted ? '#7c3aed' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              cursor: isAccepted ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isAccepted) {
                e.target.style.background = '#6d28d9';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (isAccepted) {
                e.target.style.background = '#7c3aed';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
