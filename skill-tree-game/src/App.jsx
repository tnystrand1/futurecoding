import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Student/Dashboard';
import CivDashboard from './components/Student/CivDashboard';
import ModernDashboard from './components/Student/ModernDashboard';
import UserSelector from './components/Student/UserSelector';
import TeacherView from './components/Admin/TeacherView';
import WorkingMessagingTest from './components/Messaging/WorkingMessagingTest';
import AuthProvider, { useAuth } from './components/Auth/AuthProvider';
import LoginForm from './components/Auth/LoginForm';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import './styles/tailwind.css';
import './styles/globals.css';
import './styles/pixels.css';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(139, 69, 19, 0.3)',
        borderLeft: '4px solid #8B4513',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <div style={{
        color: '#8B4513',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        Loading Web Dev Skill Tree...
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

function ProtectedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <AppContent />;
}

function AppContent() {
  const flags = useFeatureFlags();
  const location = useLocation();

  // Component selection based on feature flags
  const StudentDashboard = flags.useModernDashboard ? ModernDashboard : Dashboard;

  return (
    <div className="app">
      <Routes>
        {/* Default route - User selection screen */}
        <Route 
          path="/" 
          element={<UserSelector />} 
        />
        
        {/* Traditional dashboard route */}
        <Route path="/student/:studentId" element={<Dashboard />} />
        
        {/* Civilization III themed route */}
        <Route path="/civ/:studentId" element={<CivDashboard />} />
        
        {/* Modern dashboard route */}
        <Route path="/modern/:studentId" element={<ModernDashboard />} />
        
        {/* Feature flag controlled route */}
        <Route path="/dashboard/:studentId" element={<StudentDashboard />} />
        
        {/* Teacher/Admin route */}
        <Route path="/teacher" element={<TeacherView />} />
        
        {/* Enhanced Messaging Test Route */}
        <Route path="/test-messaging" element={<WorkingMessagingTest />} />
      </Routes>

      {/* Back to User Selection Button - Now reactive to location changes */}
      {location.pathname !== '/' && !location.pathname.includes('/teacher') && (
        <a
          href="/"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
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
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(0,0,0,0.9)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(0,0,0,0.7)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Students
        </a>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
