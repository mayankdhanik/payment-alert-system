import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SendAlert from './components/SendAlert'
import AlertHistory from './components/AlertHistory'

const appStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f0f2f5',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
}

export default function App() {
  return (
    <div style={appStyle}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <Routes>
          <Route path="/"         element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/send-alert" element={<SendAlert />} />
          <Route path="/history"    element={<AlertHistory />} />
        </Routes>
      </main>
    </div>
  )
}
