import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Student/Dashboard';
import CivDashboard from './components/Student/CivDashboard';
import ModernDashboard from './components/Student/ModernDashboard';
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
          {/* Default route - choose between modern and traditional */}
          <Route 
            path="/" 
            element={<Navigate to={flags.useModernDashboard ? "/modern/sample_student" : "/civ/sample_student"} />} 
          />
          
          {/* Traditional dashboard route */}
          <Route path="/student/:studentId" element={<Dashboard />} />
          
          {/* Civilization III themed route */}
          <Route path="/civ/:studentId" element={<CivDashboard />} />
          
          {/* Modern dashboard route */}
          <Route path="/modern/:studentId" element={<ModernDashboard />} />
          
          {/* Feature flag controlled route */}
          <Route path="/dashboard/:studentId" element={<StudentDashboard />} />
        </Routes>

        {/* Development component switcher */}
        {flags.showComponentSwitcher && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg z-50">
            <div className="text-sm font-bold mb-2">🔧 Dev Tools</div>
            <div className="space-y-2 text-xs">
              <div>
                <a href="/student/sample_student" className="text-blue-300 hover:underline">
                  Traditional Dashboard
                </a>
              </div>
              <div>
                <a href="/civ/sample_student" className="text-yellow-300 hover:underline">
                  Civ III Dashboard
                </a>
              </div>
              <div>
                <a href="/modern/sample_student" className="text-green-300 hover:underline">
                  Modern Dashboard
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
