import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from '../api'

type User = {
  id: string
  name: string
  email: string
  role: 'teacher' | 'admin'
}

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role?: 'teacher' | 'admin') => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const resp = await api.get('/auth/me')
        setUser(resp.data)
      } catch (err) {
        localStorage.removeItem('access_token')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [token])

  async function login(email: string, password: string) {
    const resp = await api.post('/auth/login', { email, password })
    const access = resp.data.access_token
    localStorage.setItem('access_token', access)
    setToken(access)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }

  async function signup(name: string, email: string, password: string, role: 'teacher' | 'admin' = 'teacher') {
    await api.post('/auth/signup', { name, email, password, role })
  }

  function logout() {
    localStorage.removeItem('access_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
