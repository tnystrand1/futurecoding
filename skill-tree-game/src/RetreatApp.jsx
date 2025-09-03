import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RetreatCivDashboard from './components/Student/RetreatCivDashboard';
import RetreatUserSelector from './components/Student/RetreatUserSelector';
import RetreatAuthProvider, { useRetreatAuth } from './components/Auth/RetreatAuthProvider';
import RetreatLoginForm from './components/Auth/RetreatLoginForm';
import './styles/tailwind.css';
import './styles/globals.css';
import './styles/pixels.css';

// Loading spinner component
function RetreatLoadingSpinner() {
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
      flexDirection: 'column',
      fontFamily: 'serif'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(244, 228, 188, 0.3)',
        borderLeft: '4px solid #F4E4BC',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <div style={{
        color: '#F4E4BC',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Loading Retreat Dashboard...
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ProtectedRetreatApp() {
  const { isAuthenticated, isLoading } = useRetreatAuth();

  if (isLoading) {
    return <RetreatLoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <RetreatLoginForm />;
  }

  return <RetreatAppContent />;
}

function RetreatAppContent() {
  const location = useLocation();

  return (
    <div className="app">
      <Routes>
        {/* Default route - Retreat user selection screen */}
        <Route 
          path="/" 
          element={<RetreatUserSelector />} 
        />
        
        {/* Retreat Civ dashboard route - only for allowed students */}
        <Route path="/retreat/civ/:studentId" element={<RetreatCivDashboard />} />
        
        {/* Redirect any other paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Back to Student Selection Button */}
      {location.pathname !== '/' && (
        <a
          href="/"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(139, 69, 19, 0.9)',
            color: '#F4E4BC',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
            border: '2px solid #F4E4BC'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(205, 133, 63, 0.9)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(139, 69, 19, 0.9)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Participants
        </a>
      )}

      {/* Retreat branding footer */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(139, 69, 19, 0.8)',
        color: '#F4E4BC',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        border: '1px solid rgba(244, 228, 188, 0.3)',
        backdropFilter: 'blur(4px)'
      }}>
        🏛️ Retreat Edition
      </div>
    </div>
  );
}

function RetreatApp() {
  return (
    <RetreatAuthProvider>
      <Router>
        <ProtectedRetreatApp />
      </Router>
    </RetreatAuthProvider>
  );
}

export default RetreatApp;
