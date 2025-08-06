import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Student/Dashboard';
import CivDashboard from './components/Student/CivDashboard';
import ModernDashboard from './components/Student/ModernDashboard';
import UserSelector from './components/Student/UserSelector';
import TeacherView from './components/Admin/TeacherView';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import './styles/tailwind.css';
import './styles/globals.css';
import './styles/pixels.css';

function App() {
  const flags = useFeatureFlags();

  // Component selection based on feature flags
  const StudentDashboard = flags.useModernDashboard ? ModernDashboard : Dashboard;

  return (
    <Router>
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
        </Routes>

        {/* Back to User Selection Button */}
        {window.location.pathname !== '/' && !window.location.pathname.includes('/teacher') && (
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
    </Router>
  );
}

export default App;
