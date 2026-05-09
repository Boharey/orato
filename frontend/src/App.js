import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Evaluation } from './pages/Evaluation';
import { Training } from './pages/Training';
import { TrainingModule } from './pages/TrainingModule';
import { Profile } from './pages/Profile';
import { TechniquePage } from './pages/Techniquepage';

// scenarios 
import { ScenarioList } from './pages/ScenarioList';
import { ScenarioDetail } from './pages/ScenarioDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluation"
            element={
              <ProtectedRoute>
                <Evaluation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training/:moduleId"
            element={
              <ProtectedRoute>
                <TrainingModule />
              </ProtectedRoute>
            }
          />

          <Route
           path="/training/:moduleId/:techniqueSlug" 
           element=
           {
            <ProtectedRoute>
              <TechniquePage />
            </ProtectedRoute>
           } 
           />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/scenarios" element={<ProtectedRoute><ScenarioList /></ProtectedRoute>} />
          <Route path="/scenarios/:scenarioId" element={<ProtectedRoute><ScenarioDetail /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;