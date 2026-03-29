import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getAlertHistory } from '../api/alertApi'

const cardColors = {
  total:  { bg: '#e3f2fd', border: '#1976d2', icon: '#1976d2', iconName: 'bi-bell-fill'        },
  neft:   { bg: '#e8f5e9', border: '#388e3c', icon: '#388e3c', iconName: 'bi-bank2'             },
  imps:   { bg: '#fff3e0', border: '#f57c00', icon: '#f57c00', iconName: 'bi-lightning-charge-fill' },
  rtgs:   { bg: '#fce4ec', border: '#c62828', icon: '#c62828', iconName: 'bi-currency-rupee'    },
  sent:   { bg: '#f3e5f5', border: '#7b1fa2', icon: '#7b1fa2', iconName: 'bi-check-circle-fill' },
  failed: { bg: '#fafafa', border: '#616161', icon: '#616161', iconName: 'bi-x-circle-fill'     },
}

function StatCard({ label, value, colorKey, onClick }) {
  const c = cardColors[colorKey]
  return (
    <div
      onClick={onClick}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s',
        flex: '1 1 140px'
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{value ?? '—'}</div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{label}</div>
        </div>
        <i className={`bi ${c.iconName}`} style={{ fontSize: '26px', color: c.icon, opacity: 0.7 }} />
      </div>
    </div>
  )
}

function statusBadge(status) {
  const map = { SENT: 'success', FAILED: 'danger', PENDING: 'warning' }
  return <span className={`badge bg-${map[status] || 'secondary'}`}>{status}</span>
}

function typeBadge(type) {
  const map = { NEFT: 'primary', IMPS: 'warning', RTGS: 'danger' }
  return <span className={`badge bg-${map[type] || 'secondary'}`}>{type}</span>
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getStats(), getAlertHistory()])
      .then(([s, h]) => {
        setStats(s.data)
        setRecent(h.data.slice(0, 8))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="spinner-border text-primary" role="status" />
        <span style={{ marginLeft: '12px', color: '#555' }}>Loading dashboard…</span>
      </div>
    )
  }

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontWeight: '700', color: '#1a1a2e' }}>
          <i className="bi bi-speedometer2" style={{ marginRight: '8px', color: '#1976d2' }} />
          Dashboard
        </h4>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Real-time summary of payment alerts
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <StatCard label="Total Alerts"   value={stats?.total}  colorKey="total"  onClick={() => navigate('/history')} />
        <StatCard label="NEFT Alerts"    value={stats?.neft}   colorKey="neft"   onClick={() => navigate('/history')} />
        <StatCard label="IMPS Alerts"    value={stats?.imps}   colorKey="imps"   onClick={() => navigate('/history')} />
        <StatCard label="RTGS Alerts"    value={stats?.rtgs}   colorKey="rtgs"   onClick={() => navigate('/history')} />
        <StatCard label="Sent"           value={stats?.sent}   colorKey="sent"   />
        <StatCard label="Failed"         value={stats?.failed} colorKey="failed" />
      </div>

      {/* Quick action */}
      <div style={{
        background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
        borderRadius: '10px',
        padding: '20px 24px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '16px' }}>Send a Payment Alert</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
            Dispatch NEFT, IMPS, or RTGS notification to customer mobile & email
          </div>
        </div>
        <button
          className="btn btn-light btn-sm"
          style={{ fontWeight: '600', whiteSpace: 'nowrap' }}
          onClick={() => navigate('/send-alert')}
        >
          <i className="bi bi-send-fill" style={{ marginRight: '6px' }} />
          Send Now
        </button>
      </div>

      {/* Recent alerts table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>Recent Alerts</span>
          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/history')}>
            View All <i className="bi bi-arrow-right" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
            <i className="bi bi-inbox" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }} />
            No alerts sent yet. <button className="btn btn-link btn-sm p-0" onClick={() => navigate('/send-alert')}>Send your first alert</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th>TXN Ref</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Alert</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(a => (
                  <tr key={a.id}>
                    <td><code style={{ fontSize: '12px' }}>{a.txnRefNo}</code></td>
                    <td>{a.customerNo}</td>
                    <td>{typeBadge(a.paymentType)}</td>
                    <td>
                      <span className={`badge bg-${a.alertType === 'DR' ? 'danger' : a.alertType === 'CR' ? 'success' : 'warning'}`}>
                        {a.alertType === 'DR' ? 'Debit' : a.alertType === 'CR' ? 'Credit' : 'Failure'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{a.currency} {Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{statusBadge(a.alertStatus)}</td>
                    <td style={{ color: '#888' }}>{a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
