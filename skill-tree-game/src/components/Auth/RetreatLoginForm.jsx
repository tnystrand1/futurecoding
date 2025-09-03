import React, { useState } from 'react';
import { useRetreatAuth } from './RetreatAuthProvider';

const RetreatLoginForm = () => {
  const { login } = useRetreatAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const result = login(password);
    
    if (!result.success) {
      setError(result.error);
      setPassword(''); // Clear password on error
    }
    
    setIsSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '4px solid #8B4513',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🏛️
          </div>
          <h1 style={{
            margin: '0 0 8px 0',
            color: '#8B4513',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Retreat Dashboard
          </h1>
          <p style={{
            margin: 0,
            color: '#8B4513',
            fontSize: '16px',
            opacity: 0.8
          }}>
            Enter the retreat password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter retreat password..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                border: `3px solid ${error ? '#e74c3c' : '#8B4513'}`,
                borderRadius: '8px',
                fontSize: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = '#CD853F';
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = '#8B4513';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(231, 76, 60, 0.1)',
              border: '2px solid #e74c3c',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#c0392b',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ❌ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            style={{
              width: '100%',
              background: isSubmitting || !password.trim()
                ? '#bdc3c7'
                : 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSubmitting || !password.trim() ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && password.trim()) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
          >
            {isSubmitting ? (
              <>
                <span>⏳</span>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Access Retreat Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid rgba(139, 69, 19, 0.2)',
          fontSize: '12px',
          color: '#8B4513',
          opacity: 0.6
        }}>
          Future Coders AI - Retreat Edition
        </div>
      </div>
    </div>
  );
};

export default RetreatLoginForm;
