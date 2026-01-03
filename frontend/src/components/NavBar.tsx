import React from 'react'
import { Link } from 'react-router-dom'
import { Header, Container, Group, Title, Button, Badge, Paper, Text, Menu, Avatar, UnstyledButton, ActionIcon, Tooltip } from '@mantine/core'
import { BarChart, LogOut, Shield, FileEdit, Home, LineChart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function NavBar(){
  const { user, logout } = useAuth()

  return (
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
            {user && <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} component={Link} to="/reports/new" leftIcon={<FileEdit size={16}/>}>New Report</Button>}
            {user?.role === 'admin' && (
              <>
                <Button variant="subtle" component={Link} to="/analytics" leftIcon={<LineChart size={16} />} size="xs">Analytics</Button>
                <Button variant="subtle" component={Link} to="/admin" leftIcon={<Shield size={16} />} size="xs">Admin</Button>
              </>
            )}

            {user?.role === 'teacher' && (
              <>
                <Button variant="subtle" component={Link} to="/teacher" leftIcon={<BarChart size={16} />} size="xs">Dashboard</Button>
                <Menu withArrow placement="bottom-end">
                  <Menu.Target>
                    <Button variant="subtle" size="xs">Manage</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item component={Link} to="/teacher/subjects">Subjects</Menu.Item>
                    <Menu.Item component={Link} to="/teacher/classrooms">Classrooms</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}

            {!user && (
              <>
                <Button variant="light" component={Link} to="/login" leftIcon={<Shield size={16}/>}>Login</Button>
                <Button variant="default" component={Link} to="/signup" leftIcon={<Shield size={16}/>}>Signup</Button>
              </>
            )}

            {user && (
              <Menu withArrow placement="bottom-end">
                <Menu.Target>
                  <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar color="indigo" radius="xl">{(user.name || user.email || 'U')[0]}</Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mantine-color-gray-4)' }}>{user.display_id || user.id.slice(0,6)}</div>
                    </div>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  {user?.role !== 'teacher' && <Menu.Item component={Link} to="/teacher">My Dashboard</Menu.Item>}
                  {user?.role === 'admin' && <Menu.Item component={Link} to="/analytics">Analytics</Menu.Item>}
                  {user?.role === 'admin' && <Menu.Item component={Link} to="/admin">Admin</Menu.Item>}
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={logout}>Logout</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </Container>
    </Header>
  )
}
