import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
})

// attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

// helpers
export const fetchSubjects = () => api.get('/subjects')
export const fetchClassrooms = () => api.get('/classrooms')
export const fetchTeachers = () => api.get('/auth/users', { params: { role: 'teacher' } })
export const createSubject = (payload: { name: string; code?: string }) => api.post('/subjects', payload)
export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`)
export const setSubjectTeachers = (id: string, teacherIds: string[]) => api.patch(`/subjects/${id}/teachers`, { teacher_ids: teacherIds })

export const createClassroom = (payload: { name: string; grade?: string }) => api.post('/classrooms', payload)
export const deleteClassroom = (id: string) => api.delete(`/classrooms/${id}`)
export const assignClassroom = (id: string, payload: { class_teacher_id?: string | null; subject_ids?: string[] }) => api.patch(`/classrooms/${id}/assign`, payload)

// reports
export const fetchReports = (params?: Record<string, any>) => api.get('/reports', { params })
export const upsertReport = (payload: any) => api.post('/reports', payload)
export const fetchReportByClassAndDate = (class_name: string, report_date: string) => api.get('/reports/current', { params: { class_name, report_date } })
export const signReportPeriod = (report_id: string, period_number: number, signature_status: 'absent' | 'signed') =>
  api.patch(`/reports/${report_id}/periods/${period_number}/sign`, { signature_status })
export const submitReportFinal = (report_id: string) => api.post(`/reports/${report_id}/submit`)
export const fetchReportHistory = (class_name: string, report_date: string) => api.get('/reports/history/by-class', { params: { class_name, report_date } })
