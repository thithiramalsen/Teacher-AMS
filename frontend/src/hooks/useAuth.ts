import { useState } from 'react'
import api from '../api'

export function useAuth() {
  const [user, setUser] = useState<any>(null)

  async function login(email: string, password: string) {
    const resp = await api.post('/auth/login', { email, password })
    const token = resp.data.access_token
    localStorage.setItem('access_token', token)
    return resp.data
  }

  async function signup(name: string, email: string, password: string, role = 'teacher') {
    const resp = await api.post('/auth/signup', { name, email, password, role })
    return resp.data
  }

  function logout() {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return { user, setUser, login, signup, logout }
}
