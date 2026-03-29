import { useEffect, useState } from 'react'
import { getAlertHistory, getAlertsByPaymentType, deleteLog } from '../api/alertApi'

function statusBadge(status) {
  const map = { SENT: ['success', 'check-circle-fill'], FAILED: ['danger', 'x-circle-fill'], PENDING: ['warning', 'clock-fill'] }
  const [color, icon] = map[status] || ['secondary', 'question-circle']
  return (
    <span className={`badge bg-${color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <i className={`bi bi-${icon}`} style={{ fontSize: '10px' }} />
      {status}
    </span>
  )
}

function typeBadge(type) {
  const map = { NEFT: '#1565c0', IMPS: '#e65100', RTGS: '#b71c1c' }
  return (
    <span style={{
      background: map[type] || '#555',
      color: '#fff',
      fontSize: '11px',
      fontWeight: '700',
      padding: '2px 8px',
      borderRadius: '12px',
      letterSpacing: '0.5px'
    }}>
      {type}
    </span>
  )
}

function alertTypeBadge(type) {
  const map = {
    DR:      { label: 'Debit',   bg: '#ffebee', color: '#c62828' },
    CR:      { label: 'Credit',  bg: '#e8f5e9', color: '#2e7d32' },
    FAILURE: { label: 'Failure', bg: '#fff3e0', color: '#e65100' }
  }
  const s = map[type] || { label: type, bg: '#f5f5f5', color: '#555' }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px' }}>
      {s.label}
    </span>
  )
}

export default function AlertHistory() {
  const [logs,    setLogs]    = useState([])
  const [filter,  setFilter]  = useState('ALL')   // ALL | NEFT | IMPS | RTGS
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [deleting, setDeleting] = useState(null)

  const fetchLogs = async (paymentType = 'ALL') => {
    setLoading(true)
    try {
      const res = paymentType === 'ALL'
        ? await getAlertHistory()
        : await getAlertsByPaymentType(paymentType)
      setLogs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(filter) }, [filter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert log?')) return
    setDeleting(id)
    try {
      await deleteLog(id)
      setLogs(prev => prev.filter(l => l.id !== id))
    } catch (e) {
      alert('Failed to delete: ' + (e.response?.data?.message || e.message))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = logs.filter(l =>
    !search ||
    l.txnRefNo?.toLowerCase().includes(search.toLowerCase()) ||
    l.customerNo?.toLowerCase().includes(search.toLowerCase()) ||
    l.mobileNo?.includes(search) ||
    l.emailId?.toLowerCase().includes(search.toLowerCase())
  )

  const filterBtns = ['ALL', 'NEFT', 'IMPS', 'RTGS']
  const colorMap   = { ALL: '#546e7a', NEFT: '#1565c0', IMPS: '#e65100', RTGS: '#b71c1c' }

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontWeight: '700', color: '#1a1a2e' }}>
          <i className="bi bi-clock-history" style={{ marginRight: '8px', color: '#1976d2' }} />
          Alert History
        </h4>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Complete log of all dispatched payment alerts
        </p>
      </div>

      {/* Filters + Search bar */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Payment type filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {filterBtns.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '2px solid',
                borderColor: filter === f ? colorMap[f] : '#dee2e6',
                background:  filter === f ? colorMap[f] : '#fff',
                color:       filter === f ? '#fff' : '#555',
                fontWeight:  filter === f ? '700' : '500',
                fontSize:    '13px',
                cursor:      'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
          <input
            className="form-control form-control-sm"
            style={{ paddingLeft: '32px' }}
            placeholder="Search by TXN Ref, Customer, Mobile, Email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Refresh */}
        <button className="btn btn-sm btn-outline-secondary" onClick={() => fetchLogs(filter)}>
          <i className="bi bi-arrow-clockwise" />
        </button>

        {/* Count badge */}
        <span style={{ fontSize: '13px', color: '#888' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="spinner-border text-primary" role="status" />
            <span style={{ marginLeft: '12px', color: '#555' }}>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>
            <i className="bi bi-inbox" style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }} />
            No alerts found for the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>TXN Ref No</th>
                  <th style={th}>Customer</th>
                  <th style={th}>Type</th>
                  <th style={th}>Alert</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Mobile</th>
                  <th style={th}>Email</th>
                  <th style={th}>Status</th>
                  <th style={th}>Sent At</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: '#aaa', fontSize: '12px' }}>{i + 1}</td>
                    <td><code style={{ fontSize: '12px', color: '#1565c0' }}>{a.txnRefNo}</code></td>
                    <td style={{ fontWeight: '600' }}>{a.customerNo}</td>
                    <td>{typeBadge(a.paymentType)}</td>
                    <td>{alertTypeBadge(a.alertType)}</td>
                    <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {a.currency} {Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#555' }}>{a.mobileNo || '—'}</td>
                    <td style={{ color: '#555', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.emailId || '—'}
                    </td>
                    <td>{statusBadge(a.alertStatus)}</td>
                    <td style={{ color: '#888', whiteSpace: 'nowrap' }}>
                      {a.sentAt ? new Date(a.sentAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                        disabled={deleting === a.id}
                        onClick={() => handleDelete(a.id)}
                      >
                        {deleting === a.id
                          ? <span className="spinner-border spinner-border-sm" />
                          : <i className="bi bi-trash3" />}
                      </button>
                    </td>
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

const th = { fontSize: '12px', fontWeight: '700', color: '#555', padding: '10px 12px', whiteSpace: 'nowrap' }
