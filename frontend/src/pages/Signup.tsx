import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, TextInput, PasswordInput, Button, Title, Space } from '@mantine/core'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function Signup(){
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; email: string; password: string }>({ mode: 'onTouched' })
  const navigate = useNavigate()
  const { signup } = useAuth()

  async function onSubmit(data: any){
    try{
      await signup(data.name, data.email, data.password)
      navigate('/login')
    }catch(err){
      toast.error('Signup failed')
    }
  }

  return (
    <Card shadow="lg" padding="xl" style={{ maxWidth: 520, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Title order={2} mb="sm" style={{ display:'flex', alignItems:'center', gap:8 }}><UserPlus size={20}/> Create account</Title>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          label="Name"
          placeholder="Full name"
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            pattern: { value: /^[A-Za-z ]+$/, message: 'Name can only contain letters and spaces' },
          })}
          error={errors.name?.message}
        />
        <Space h="sm" />
        <TextInput
          label="Email"
          placeholder="you@example.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })}
          error={errors.email?.message}
        />
        <Space h="sm" />
        <PasswordInput
          label="Password"
          placeholder="Choose a password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
            pattern: { value: /^[A-Za-z0-9]+$/, message: 'Password can only contain letters and numbers' },
          })}
          error={errors.password?.message}
        />
        <Space h="md" />
        <Button type="submit">Sign up</Button>
      </form>
    </Card>
  )
}
