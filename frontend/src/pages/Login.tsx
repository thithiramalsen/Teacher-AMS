import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, TextInput, Button, PasswordInput, Title, Space } from '@mantine/core'
import { Shield } from 'lucide-react'

export default function Login() {
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const { login } = useAuth()

  async function onSubmit(data: any) {
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      alert('Login failed')
    }
  }

  return (
    <Card shadow="lg" padding="xl" style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Title order={2} mb="sm" style={{ display:'flex', alignItems:'center', gap:8 }}><Shield size={20}/> Login</Title>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Email" placeholder="you@example.com" {...register('email')} required />
        <Space h="sm" />
        <PasswordInput label="Password" placeholder="Your password" {...register('password')} required />
        <Space h="md" />
        <Button type="submit">Login</Button>
      </form>
    </Card>
  )
}
