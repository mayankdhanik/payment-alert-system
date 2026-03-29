import axios from 'axios'

/**
 * Axios instance — all calls go to Spring Boot backend at :8080
 * Vite proxy forwards /api/* → http://localhost:8080
 */
const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://payment-alert-system.onrender.com/api'
    : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000
})

// -------------------------------------------------------
// Alert endpoints — AlertController (/api/alerts)
// -------------------------------------------------------

/** POST /api/alerts/send — send a NEFT/IMPS/RTGS alert */
export const sendAlert = (alertRequest) =>
  api.post('/alerts/send', alertRequest)

/** GET /api/alerts/history — all alerts, newest first */
export const getAlertHistory = () =>
  api.get('/alerts/history')

/** GET /api/alerts/customer/:customerNo */
export const getAlertsByCustomer = (customerNo) =>
  api.get(`/alerts/customer/${customerNo}`)

/** GET /api/alerts/type/:paymentType (NEFT | IMPS | RTGS) */
export const getAlertsByPaymentType = (paymentType) =>
  api.get(`/alerts/type/${paymentType}`)

/** GET /api/alerts/stats — dashboard summary counts */
export const getStats = () =>
  api.get('/alerts/stats')

// -------------------------------------------------------
// Log endpoints — LogController (/api/logs)
// -------------------------------------------------------

/** GET /api/logs — all logs */
export const getAllLogs = () =>
  api.get('/logs')

/** GET /api/logs/:id */
export const getLogById = (id) =>
  api.get(`/logs/${id}`)

/** GET /api/logs/status/:status (PENDING | SENT | FAILED) */
export const getLogsByStatus = (status) =>
  api.get(`/logs/status/${status}`)

/** DELETE /api/logs/:id */
export const deleteLog = (id) =>
  api.delete(`/logs/${id}`)
