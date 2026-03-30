import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard',  icon: 'bi-speedometer2',  label: 'Dashboard'     },
  { to: '/send-alert', icon: 'bi-send-fill',      label: 'Send Alert'    },
  { to: '/history',    icon: 'bi-clock-history',  label: 'Alert History' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <aside style={{
        width: '240px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        zIndex: 100,
        transition: 'transform 0.3s ease'
      }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          {/* Mobile close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="bi bi-bell-fill" style={{ fontSize: '22px', color: '#90caf9' }} />
              <span style={{ fontSize: '16px', fontWeight: '700', lineHeight: 1.2 }}>
                Payment Alert<br />
                <span style={{ fontSize: '11px', fontWeight: '400', color: 'rgba(255,255,255,0.65)' }}>
                  NEFT · IMPS · RTGS
                </span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 4px'
              }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                margin: '2px 0'
              })}
            >
              <i className={`bi ${icon}`} style={{ fontSize: '17px' }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
          <i className="bi bi-shield-check" style={{ marginRight: '6px' }} />
          Secure Banking Portal
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            height: 100vh !important;
            transform: translateX(-100%);
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </>
  )
}
