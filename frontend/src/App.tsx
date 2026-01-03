import React from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Header, Container, Group, Anchor, Title, Button, Badge, Paper, Text } from '@mantine/core'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ReportForm from './pages/ReportForm'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Analytics from './pages/Analytics'
import { BarChart, LogOut, Shield, FileEdit, Home, LineChart } from 'lucide-react'

export default function App() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const onLoginPage = location.pathname === '/login'
  const onSignupPage = location.pathname === '/signup'

  return (
    <>
      <Header height={72} px="md" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Container style={{ height: '100%' }}>
          <Group position="apart" align="center" style={{ height: '100%' }}>
            <Group spacing="xs" align="center">
              <Badge color="indigo" variant="filled" size="lg" radius="sm">AMS</Badge>
              <Title order={3} style={{ margin: 0 }}>Teacher AMS</Title>
              {user && <Badge color="teal" variant="outline">{user.role}</Badge>}
            </Group>
            <Group spacing="sm">
              <Button variant="subtle" component={Link} to="/" leftIcon={<Home size={16}/>}>Home</Button>
              {!user && <Button variant="light" component={Link} to="/login" leftIcon={<Shield size={16}/>}>Login</Button>}
              {!user && <Button variant="default" component={Link} to="/signup" leftIcon={<Shield size={16}/>}>Signup</Button>}
              {user && <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} component={Link} to="/reports/new" leftIcon={<FileEdit size={16}/>}>New Report</Button>}
              {user?.role === 'admin' && <Button variant="outline" component={Link} to="/analytics" leftIcon={<LineChart size={16}/>}>Analytics</Button>}
              {user && <Button variant="subtle" color="red" leftIcon={<LogOut size={16}/>} onClick={logout}>Logout</Button>}
            </Group>
          </Group>
        </Container>
      </Header>
      <Container size="lg" style={{ paddingTop: 24 }}>
        <Routes>
          <Route path="/" element={<HomeHero user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login/>} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup/>} />
          <Route path="/reports/new" element={<ProtectedRoute><ReportForm/></ProtectedRoute>} />
          <Route path="/analytics" element={<AdminRoute><Analytics/></AdminRoute>} />
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
