import { useState } from 'react'
import { sendAlert } from '../api/alertApi'

const INITIAL = {
  paymentType: 'NEFT',
  alertType:   'DR',
  customerNo:  '',
  txnRefNo:    '',
  amount:      '',
  currency:    'INR',
  drAcNo:      '',
  crAcNo:      '',
  mobileNo:    '',
  emailId:     '',
  rrn:         '',
  message:     ''
}

// Template message builders (mirrors backend logic — useful for live preview)
function buildPreview(f) {
  if (!f.customerNo || !f.amount) return ''
  const masked = (ac) => ac ? 'X'.repeat(Math.max(0, ac.length - 4)) + ac.slice(-4) : 'N/A'
  const ts = new Date().toLocaleString('en-IN')

  if (f.alertType === 'DR') {
    return `Dear Customer ${f.customerNo}, Your A/c ${masked(f.drAcNo)} has been debited with ${f.currency} ${Number(f.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${ts}. ${f.paymentType} Ref: ${f.txnRefNo || 'XXXXXX'}. If not done by you, call 1800-XXX-XXXX.`
  }
  if (f.alertType === 'CR') {
    return `Dear Customer ${f.customerNo}, Your A/c ${masked(f.crAcNo)} has been credited with ${f.currency} ${Number(f.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${ts}. ${f.paymentType} Ref: ${f.txnRefNo || 'XXXXXX'}. Sender: ${masked(f.drAcNo)}.`
  }
  return `Dear Customer ${f.customerNo}, Your ${f.paymentType} of ${f.currency} ${Number(f.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Ref: ${f.txnRefNo || 'XXXXXX'}) on ${ts} has FAILED. Amount will reverse in 2-3 working days.`
}

const paymentTypes = ['NEFT', 'IMPS', 'RTGS']
const alertTypes   = [
  { value: 'DR',      label: 'Debit Alert',   color: '#dc3545' },
  { value: 'CR',      label: 'Credit Alert',  color: '#198754' },
  { value: 'FAILURE', label: 'Failure Alert', color: '#fd7e14' }
]

export default function SendAlert() {
  const [form,      setForm]      = useState(INITIAL)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear previous result when user edits
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      const res = await sendAlert(payload)
      setResult(res.data)
      if (res.data.success) {
        setForm(INITIAL) // reset on success
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send alert')
    } finally {
      setLoading(false)
    }
  }

  const preview = buildPreview(form)

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontWeight: '700', color: '#1a1a2e' }}>
          <i className="bi bi-send-fill" style={{ marginRight: '8px', color: '#1976d2' }} />
          Send Payment Alert
        </h4>
        <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 0' }}>
          Fill in the transaction details to dispatch an alert to customer mobile & email
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

        {/* ---- FORM ---- */}
        <div style={{ flex: '1 1 480px', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '24px' }}>
          <form onSubmit={handleSubmit}>

            {/* Payment Type Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Payment Type <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {paymentTypes.map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, paymentType: t }))}
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: '8px', border: '2px solid',
                      borderColor: form.paymentType === t ? '#1976d2' : '#dee2e6',
                      background:  form.paymentType === t ? '#e3f2fd' : '#fff',
                      color:       form.paymentType === t ? '#1976d2' : '#555',
                      fontWeight:  form.paymentType === t ? '700' : '500',
                      cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Type Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Alert Type <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {alertTypes.map(at => (
                  <button
                    key={at.value} type="button"
                    onClick={() => setForm(p => ({ ...p, alertType: at.value }))}
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: '8px', border: '2px solid',
                      borderColor: form.alertType === at.value ? at.color : '#dee2e6',
                      background:  form.alertType === at.value ? at.color + '18' : '#fff',
                      color:       form.alertType === at.value ? at.color : '#555',
                      fontWeight:  form.alertType === at.value ? '700' : '500',
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    {at.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row: Customer + TXN Ref */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Customer No <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control form-control-sm" name="customerNo" value={form.customerNo}
                  onChange={handleChange} placeholder="e.g. CUST001234" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>TXN Ref No <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control form-control-sm" name="txnRefNo" value={form.txnRefNo}
                  onChange={handleChange} placeholder="e.g. SBIN0001234" required />
              </div>
            </div>

            {/* Row: Amount + Currency */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Amount <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control form-control-sm" name="amount" type="number"
                  step="0.01" min="0.01" value={form.amount}
                  onChange={handleChange} placeholder="e.g. 50000.00" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Currency</label>
                <select className="form-select form-select-sm" name="currency" value={form.currency} onChange={handleChange}>
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
            </div>

            {/* Row: DR Account + CR Account */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Debit A/c No</label>
                <input className="form-control form-control-sm" name="drAcNo" value={form.drAcNo}
                  onChange={handleChange} placeholder="Sender account" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Credit A/c No</label>
                <input className="form-control form-control-sm" name="crAcNo" value={form.crAcNo}
                  onChange={handleChange} placeholder="Beneficiary account" />
              </div>
            </div>

            {/* Row: Mobile + Email */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Mobile No <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control form-control-sm" name="mobileNo" value={form.mobileNo}
                  onChange={handleChange} placeholder="10-digit mobile" pattern="[6-9]\d{9}" required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email ID <span style={{ color: 'red' }}>*</span></label>
                <input className="form-control form-control-sm" name="emailId" type="email" value={form.emailId}
                  onChange={handleChange} placeholder="customer@email.com" required />
              </div>
            </div>

            {/* RRN */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>RRN / UTR No</label>
              <input className="form-control form-control-sm" name="rrn" value={form.rrn}
                onChange={handleChange} placeholder="Retrieval Reference / UTR Number" />
            </div>

            {/* Custom Message (optional) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Custom Message <span style={{ color: '#999', fontWeight: '400' }}>(optional — leave blank to auto-generate)</span></label>
              <textarea className="form-control form-control-sm" name="message" rows={3}
                value={form.message} onChange={handleChange}
                placeholder="Leave blank to auto-generate from template…" />
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}
              style={{ fontWeight: '600', padding: '10px' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</>
                : <><i className="bi bi-send-fill me-2" />Send Alert</>}
            </button>
          </form>
        </div>

        {/* ---- RIGHT PANEL: Preview + Result ---- */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Live message preview */}
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#1a1a2e' }}>
              <i className="bi bi-eye" style={{ marginRight: '6px', color: '#1976d2' }} />
              Live Message Preview
            </div>
            {preview
              ? (
                <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', fontSize: '13px', lineHeight: '1.6', color: '#333', border: '1px solid #e0e0e0' }}>
                  {preview}
                </div>
              )
              : (
                <div style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>
                  Fill in Customer No and Amount to see a preview…
                </div>
              )
            }
          </div>

          {/* Channel indicators */}
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#1a1a2e' }}>
              <i className="bi bi-megaphone-fill" style={{ marginRight: '6px', color: '#1976d2' }} />
              Alert Channels
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Channel icon="bi-phone-fill"   label="SMS to Mobile" active={!!form.mobileNo} value={form.mobileNo} />
              <Channel icon="bi-envelope-fill" label="Email"         active={!!form.emailId}  value={form.emailId}  />
            </div>
          </div>

          {/* Result panel */}
          {result && (
            <div style={{
              borderRadius: '10px', padding: '16px',
              background: result.success ? '#e8f5e9' : '#ffebee',
              border: `1px solid ${result.success ? '#a5d6a7' : '#ef9a9a'}`
            }}>
              <div style={{ fontWeight: '700', color: result.success ? '#2e7d32' : '#c62828', marginBottom: '8px' }}>
                <i className={`bi ${result.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '6px' }} />
                {result.success ? 'Alert Sent Successfully!' : 'Alert Failed'}
              </div>
              {result.alertId  && <div style={detailRow}><b>Alert ID:</b> #{result.alertId}</div>}
              {result.txnRefNo && <div style={detailRow}><b>TXN Ref:</b> {result.txnRefNo}</div>}
              {result.status   && <div style={detailRow}><b>Status:</b> {result.status}</div>}
              {result.error    && <div style={{ ...detailRow, color: '#b71c1c', marginTop: '6px' }}><b>Error:</b> {result.error}</div>}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ borderRadius: '10px', fontSize: '13px' }}>
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Channel({ icon, label, active, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: active ? '#e3f2fd' : '#f5f5f5', border: `1px solid ${active ? '#90caf9' : '#e0e0e0'}` }}>
      <i className={`bi ${icon}`} style={{ color: active ? '#1976d2' : '#bbb', fontSize: '16px' }} />
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: active ? '#1565c0' : '#aaa' }}>{label}</div>
        {active && <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>{value}</div>}
        {!active && <div style={{ fontSize: '11px', color: '#bbb' }}>Not provided</div>}
      </div>
      {active && <i className="bi bi-check-circle-fill ms-auto" style={{ color: '#43a047', fontSize: '14px' }} />}
    </div>
  )
}

const labelStyle = { fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px', display: 'block' }
const detailRow  = { fontSize: '12px', color: '#333', marginBottom: '4px' }
