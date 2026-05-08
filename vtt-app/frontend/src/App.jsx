import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Campaign from './components/Campaign';
import { useAuthStore } from './store';

function App() {
  const initAuth = useAuthStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaign/:id" element={<Campaign />} />
      </Routes>
    </Router>
  );
}

export default App;
