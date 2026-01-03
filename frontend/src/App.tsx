import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header, Container, Group, Anchor, Title } from '@mantine/core'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ReportForm from './pages/ReportForm'

export default function App() {
  return (
    <>
      <Header height={70} px="md">
        <Container style={{ height: '100%' }}>
          <Group position="apart" align="center" style={{ height: '100%' }}>
            <Title order={3} style={{ margin: 0 }}>Teacher AMS</Title>
            <Group>
              <Anchor href="/">Home</Anchor>
              <Anchor href="/login">Login</Anchor>
              <Anchor href="/signup">Signup</Anchor>
              <Anchor href="/reports/new">New Report</Anchor>
            </Group>
          </Group>
        </Container>
      </Header>
      <Container size="lg" style={{ paddingTop: 24 }}>
        <Routes>
          <Route path="/" element={<div><Title order={2}>Welcome</Title><p>Use the navigation to login or create reports.</p></div>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/reports/new" element={<ReportForm/>} />
        </Routes>
      </Container>
    </>
  )
}
