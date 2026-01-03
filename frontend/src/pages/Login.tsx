import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, TextInput, Button, PasswordInput, Title, Space } from '@mantine/core'

export default function Login() {
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const { login } = useAuth()

  async function onSubmit(data: any) {
    try {
      const resp = await login(data.email, data.password)
      if (resp?.access_token) {
        navigate('/')
      }
    } catch (err) {
      alert('Login failed')
    }
  }

  return (
    <Card shadow="sm" padding="lg" style={{ maxWidth: 520, margin: '0 auto' }}>
      <Title order={2}>Login</Title>
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
