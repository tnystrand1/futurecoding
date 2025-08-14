import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase-config';

const PinManager = ({ student, onClose, onSuccess }) => {
  const [step, setStep] = useState(student?.pin ? 'verify' : 'create'); // 'verify', 'create', 'confirm'
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasExistingPin = student?.pin;

  const handleVerifyCurrentPin = () => {
    if (currentPin === student.pin) {
      setStep('create');
      setError('');
    } else {
      setError('Incorrect current PIN');
    }
  };

  const handleCreatePin = () => {
    if (newPin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must contain only numbers');
      return;
    }
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = async () => {
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Update student record in Firestore
      await updateDoc(doc(db, 'students', student.id), {
        pin: newPin,
        // Also update admin info for teacher reference
        'adminInfo.pinForTeacher': newPin,
        'adminInfo.lastPinUpdate': new Date().toISOString()
      });

      onSuccess(hasExistingPin ? 'PIN updated successfully!' : 'PIN set successfully!');
    } catch (error) {
      console.error('Error updating PIN:', error);
      setError('Failed to update PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError('');
    } else if (step === 'create' && hasExistingPin) {
      setStep('verify');
      setNewPin('');
      setError('');
    }
  };

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
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        color: '#8B4513'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{
            color: '#8B4513',
            margin: '0 0 10px 0',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {hasExistingPin ? '🔐 Change Your PIN' : '🔒 Set Your PIN'}
          </h2>
          <p style={{
            fontSize: '14px',
            opacity: 0.8,
            margin: 0,
            lineHeight: '1.4'
          }}>
            {hasExistingPin 
              ? 'Keep your account secure by updating your PIN'
              : 'Protect your account with a 4-digit PIN'
            }
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Verify Current PIN (if exists) */}
        {step === 'verify' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                Enter your current PIN:
              </label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCurrentPin(value);
                  setError('');
                }}
                style={{
                  width: '120px',
                  padding: '16px',
                  border: '2px solid #8B4513',
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'block',
                  margin: '0 auto'
                }}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleCancel}
                style={{
                  background: 'rgba(139, 69, 19, 0.1)',
                  color: '#8B4513',
                  border: '2px solid #8B4513',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCurrentPin}
                disabled={currentPin.length !== 4}
                style={{
                  background: currentPin.length === 4 ? '#8B4513' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: currentPin.length === 4 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Create New PIN */}
        {step === 'create' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                {hasExistingPin ? 'Enter your new PIN:' : 'Create a 4-digit PIN:'}
              </label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setNewPin(value);
                  setError('');
                }}
                style={{
                  width: '120px',
                  padding: '16px',
                  border: '2px solid #8B4513',
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'block',
                  margin: '0 auto'
                }}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
              <p style={{
                fontSize: '12px',
                opacity: 0.7,
                textAlign: 'center',
                margin: '8px 0 0 0'
              }}>
                Choose something memorable but secure
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {hasExistingPin && (
                <button
                  onClick={handleBack}
                  style={{
                    background: 'rgba(139, 69, 19, 0.1)',
                    color: '#8B4513',
                    border: '2px solid #8B4513',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleCancel}
                style={{
                  background: 'rgba(139, 69, 19, 0.1)',
                  color: '#8B4513',
                  border: '2px solid #8B4513',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePin}
                disabled={newPin.length !== 4}
                style={{
                  background: newPin.length === 4 ? '#8B4513' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: newPin.length === 4 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm New PIN */}
        {step === 'confirm' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                Confirm your new PIN:
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setConfirmPin(value);
                  setError('');
                }}
                style={{
                  width: '120px',
                  padding: '16px',
                  border: '2px solid #8B4513',
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'block',
                  margin: '0 auto'
                }}
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleBack}
                style={{
                  background: 'rgba(139, 69, 19, 0.1)',
                  color: '#8B4513',
                  border: '2px solid #8B4513',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmPin}
                disabled={confirmPin.length !== 4 || isSubmitting}
                style={{
                  background: confirmPin.length === 4 && !isSubmitting ? '#8B4513' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: confirmPin.length === 4 && !isSubmitting ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? 'Saving...' : (hasExistingPin ? 'Update PIN' : 'Set PIN')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinManager;
