import React from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Paper, Container, Group, Title, Text, Button } from '@mantine/core'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ReportForm from './pages/ReportForm'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Analytics from './pages/Analytics'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import { BarChart, FileEdit } from 'lucide-react'

export default function App() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const onLoginPage = location.pathname === '/login'
  const onSignupPage = location.pathname === '/signup'

  return (
    <>
      <NavBar />
      <Container size="lg" style={{ paddingTop: 24 }}>
        <Routes>
          <Route path="/" element={<HomeHero user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login/>} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup/>} />
          <Route path="/reports/new" element={<ProtectedRoute><ReportForm/></ProtectedRoute>} />
          <Route path="/analytics" element={<AdminRoute><Analytics/></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard/></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  )
}

function HomeHero({ user }: { user: any }) {
  return (
    <Paper radius="md" p="xl" withBorder style={{ background: 'linear-gradient(135deg, #1c2541 0%, #0b132b 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <Group position="apart" align="flex-start">
        <div>
          <Title order={2} color="white">Welcome {user ? user.name : 'Educator'}</Title>
          <Text color="gray.4" size="md">Log lessons, track signatures, and monitor workload with an admin-only analytics view.</Text>
          <Group mt="md">
            <Button component={Link} to={user ? '/reports/new' : '/login'} variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} leftIcon={<FileEdit size={16}/>}>{user ? 'Create Report' : 'Login to start'}</Button>
            <Button component={Link} to={user ? '/analytics' : '/signup'} variant="outline" color="gray" leftIcon={<BarChart size={16}/>}>{user ? 'View Analytics' : 'Create account'}</Button>
          </Group>
        </div>
      </Group>
    </Paper>
  )
}
