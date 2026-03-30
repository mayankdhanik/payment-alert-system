import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SendAlert from './components/SendAlert'
import AlertHistory from './components/AlertHistory'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile top bar */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'linear-gradient(90deg, #0d47a1, #1976d2)',
          color: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
          className="mobile-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', padding: 0 }}
          >
            <i className="bi bi-list" />
          </button>
          <i className="bi bi-bell-fill" style={{ fontSize: '18px', color: '#90caf9' }} />
          <span style={{ fontWeight: '700', fontSize: '15px' }}>Payment Alert System</span>
        </div>

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }} className="main-content">
          <Routes>
            <Route path="/"           element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/send-alert" element={<SendAlert />} />
            <Route path="/history"    element={<AlertHistory />} />
          </Routes>
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .main-content { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}
