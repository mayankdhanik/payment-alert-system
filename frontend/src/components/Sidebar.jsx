import { NavLink } from 'react-router-dom'

const sidebarStyle = {
  width: '240px',
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
  position: 'sticky',
  top: 0,
  height: '100vh'
}

const brandStyle = {
  padding: '24px 20px 20px',
  borderBottom: '1px solid rgba(255,255,255,0.15)'
}

const navStyle = { padding: '16px 0', flex: 1 }

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 24px',
  color: 'rgba(255,255,255,0.8)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s',
  borderLeft: '3px solid transparent',
  margin: '2px 0'
}

const activeStyle = {
  ...linkBase,
  color: '#fff',
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderLeft: '3px solid #fff'
}

const navItems = [
  { to: '/dashboard',  icon: 'bi-speedometer2',    label: 'Dashboard'    },
  { to: '/send-alert', icon: 'bi-send-fill',        label: 'Send Alert'   },
  { to: '/history',    icon: 'bi-clock-history',    label: 'Alert History'},
]

export default function Sidebar() {
  return (
    <aside style={sidebarStyle}>
      {/* Brand */}
      <div style={brandStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <i className="bi bi-bell-fill" style={{ fontSize: '22px', color: '#90caf9' }} />
          <span style={{ fontSize: '16px', fontWeight: '700', lineHeight: 1.2 }}>
            Payment Alert<br />
            <span style={{ fontSize: '11px', fontWeight: '400', color: 'rgba(255,255,255,0.65)' }}>
              NEFT · IMPS · RTGS
            </span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => (isActive ? activeStyle : linkBase)}
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
  )
}
