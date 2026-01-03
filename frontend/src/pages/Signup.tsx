import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, TextInput, PasswordInput, Button, Title, Space } from '@mantine/core'
import { UserPlus } from 'lucide-react'

export default function Signup(){
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const { signup } = useAuth()

  async function onSubmit(data: any){
    try{
      await signup(data.name, data.email, data.password)
      navigate('/login')
    }catch(err){
      alert('Signup failed')
    }
  }

  return (
    <Card shadow="lg" padding="xl" style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Title order={2} mb="sm" style={{ display:'flex', alignItems:'center', gap:8 }}><UserPlus size={20}/> Create account</Title>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Name" placeholder="Full name" {...register('name')} required />
        <Space h="sm" />
        <TextInput label="Email" placeholder="you@example.com" {...register('email')} required />
        <Space h="sm" />
        <PasswordInput label="Password" placeholder="Choose a password" {...register('password')} required />
        <Space h="md" />
        <Button type="submit">Sign up</Button>
      </form>
    </Card>
  )
}
