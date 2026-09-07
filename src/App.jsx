import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminDashboard from './pages/AdminDashboard';
import MemberFormPage from './pages/MemberFormPage';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-rotary-gold/30 selection:text-rotary-navy">
          <Navbar />
          
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/member-form" element={<MemberFormPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}
