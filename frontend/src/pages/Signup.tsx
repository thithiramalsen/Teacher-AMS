import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card, TextInput, PasswordInput, Button, Select, Title, Space } from '@mantine/core'

export default function Signup(){
  const { register, handleSubmit, control } = useForm()
  const navigate = useNavigate()
  const { signup } = useAuth()

  async function onSubmit(data: any){
    try{
      await signup(data.name, data.email, data.password, data.role)
      navigate('/login')
    }catch(err){
      alert('Signup failed')
    }
  }

  return (
    <Card shadow="sm" padding="lg" style={{ maxWidth: 520, margin: '0 auto' }}>
      <Title order={2}>Create account</Title>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput label="Name" placeholder="Full name" {...register('name')} required />
        <Space h="sm" />
        <TextInput label="Email" placeholder="you@example.com" {...register('email')} required />
        <Space h="sm" />
        <PasswordInput label="Password" placeholder="Choose a password" {...register('password')} required />
        <Space h="sm" />
        <Controller
          control={control}
          name="role"
          defaultValue="teacher"
          render={({ field }) => (
            <Select
              label="Role"
              data={[{ value: 'teacher', label: 'Teacher' }, { value: 'admin', label: 'Admin' }]}
              {...field}
            />
          )}
        />
        <Space h="md" />
        <Button type="submit">Sign up</Button>
      </form>
    </Card>
  )
}
