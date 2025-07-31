import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Student/Dashboard';
import CivDashboard from './components/Student/CivDashboard';
import './styles/globals.css';
import './styles/pixels.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/civ/sample_student" />} />
          <Route path="/student/:studentId" element={<Dashboard />} />
          <Route path="/civ/:studentId" element={<CivDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
