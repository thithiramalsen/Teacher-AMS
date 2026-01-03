import api from '../api'

export async function createReport(payload: any) {
  const resp = await api.post('/reports', payload)
  return resp.data
}

export async function listReports() {
  const resp = await api.get('/reports')
  return resp.data
}
