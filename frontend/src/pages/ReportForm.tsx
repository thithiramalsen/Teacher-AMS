import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { createReport } from '../hooks/useReports'
import { useNavigate } from 'react-router-dom'
import { Card, TextInput, Checkbox, Button, Textarea, Grid, Group, Title, Space, Table, Text, ScrollArea, Badge, Select } from '@mantine/core'
import { FileEdit } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchSubjects, fetchClassrooms, fetchTeachers } from '../api'

const formatObjectId = (id?: string) => {
  if (!id) return ''
  if (id.length <= 8) return id
  return `${id.slice(0, 4)}...${id.slice(-4)}`
}

export default function ReportForm(){
  const { user } = useAuth()
  const { register, control, handleSubmit, watch, setValue } = useForm<any>({
    defaultValues: { periods: Array.from({length:8}, (_,i)=>({ period_number: i+1, subject: '', topic: '', subject_teacher_id: '', signed: false, remarks: '' })) }
  })
  const { fields } = useFieldArray<any>({ control, name: 'periods' })
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([])
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string; classTeacherId?: string }[]>([])
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])
  const navigate = useNavigate()
  const periods = watch('periods') || []
  const totalTaught = useMemo(() => {
    const list = Array.isArray(periods) ? periods : []
    return list.reduce((acc, p) => acc + (p?.signed ? 1 : 0), 0)
  }, [periods])
  const teacherDisplayId = useMemo(() => {
    if (!user) return ''
    const short = user.display_id || formatObjectId(user.id)
    return user.name ? `${user.name} (${short})` : short
  }, [user])

  const classNameValue = watch('class_name')

  const classTeacherDisplay = useMemo(() => {
    if (!classNameValue) return teacherDisplayId
    const foundClass = classroomOptions.find(c => c.value === classNameValue)
    if (!foundClass?.classTeacherId) return teacherDisplayId
    const foundTeacher = teacherOptions.find(t => t.value === foundClass.classTeacherId)
    return foundTeacher ? foundTeacher.label : teacherDisplayId
  }, [classNameValue, classroomOptions, teacherOptions, teacherDisplayId])

  useEffect(() => {
    if (!user) return
    const needsPeriodUpdate = (periods || []).some((p: any) => !p?.subject_teacher_id)
    const needsClassUpdate = !watch('class_teacher_id')
    if (!needsPeriodUpdate && !needsClassUpdate) return
    if (needsClassUpdate) setValue('class_teacher_id', user.id)
    const updated = (periods || []).map((p: any, idx: number) => ({
      ...p,
      period_number: idx + 1,
      subject_teacher_id: p.subject_teacher_id || user.id,
    }))
    if (needsPeriodUpdate) setValue('periods', updated)
  }, [user, setValue, periods, watch])

  useEffect(() => {
    async function loadLists() {
      try {
        const [subjectsRes, classroomsRes, teachersRes] = await Promise.all([
          fetchSubjects(),
          fetchClassrooms(),
          fetchTeachers(),
        ])
        setSubjectOptions(subjectsRes.data.map((s: any) => ({ value: s._id, label: s.name })))
        setClassroomOptions(classroomsRes.data.map((c: any) => ({ value: c._id, label: c.name, classTeacherId: c.class_teacher_id })))
        setTeacherOptions(teachersRes.data.map((t: any) => ({ value: t.id, label: `${t.name} (${t.display_id || t.id.slice(0,4)+'...'+t.id.slice(-4)})` })))
      } catch (err) {
        // ignore for now; UI will show empty dropdowns
      }
    }
    loadLists()
  }, [])

  async function onSubmit(data: any){
    try{
      const payload = {
        ...data,
        class_teacher_id: data.class_teacher_id || user?.id,
        periods: (data.periods || []).map((p: any, idx: number) => ({
          ...p,
          period_number: idx + 1,
          subject_teacher_id: p.subject_teacher_id || user?.id,
        })),
      }
      const resp = await createReport(payload)
      alert('Created: ' + resp.id)
      navigate('/')
    }catch(err){
      alert('Failed to create report. Please check all required fields.')
    }
  }

  return (
    <Card shadow="lg" padding="xl" style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Group position="apart" align="center">
        <Title order={2} style={{ display:'flex', alignItems:'center', gap:8 }}><FileEdit size={22}/> New Daily Report</Title>
        <Badge color="indigo" variant="filled">v1</Badge>
      </Group>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid align="end" gutter="md">
          <Grid.Col span={4}>
            <TextInput label="Date" type="date" {...register('date')} required />
          </Grid.Col>
          <Grid.Col span={4}>
            <input type="hidden" {...register('class_teacher_id')} />
            <TextInput label="Class teacher" placeholder="Class teacher" value={classTeacherDisplay} readOnly description="Set automatically from selected classroom" />
          </Grid.Col>
          <Grid.Col span={4}>
            <Group position="apart" align="center">
              <Text weight={600}>Total periods taught</Text>
              <Text size="xl" weight={700}>{totalTaught}</Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={6}>
            <input type="hidden" {...register('class_name')} />
            <Select
              label="Classroom"
              placeholder="Select classroom"
              data={classroomOptions}
              value={watch('class_name')}
              onChange={(value) => {
                setValue('class_name', value || '')
                const found = classroomOptions.find((c) => c.value === value)
                if (found?.classTeacherId) setValue('class_teacher_id', found.classTeacherId)
              }}
              searchable
              clearable
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label="Logged in as" value={user?.name || user?.email || ''} readOnly />
          </Grid.Col>
        </Grid>

        <Space h="md" />
        <Title order={4}>Periods</Title>
        <Space h="sm" />
        <ScrollArea>
          <Table striped highlightOnHover withBorder withColumnBorders>
            <thead>
              <tr>
                <th>Period No</th>
                <th>Topic Taught</th>
                <th>Subject</th>
                <th>Subject Teacher ID</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => (
                <tr key={f.id}>
                  <td>
                    <TextInput {...register(`periods.${idx}.period_number`)} readOnly />
                  </td>
                  <td>
                    <Textarea minRows={1} autosize placeholder="Topic" {...register(`periods.${idx}.topic`)} />
                  </td>
                  <td>
                    <input type="hidden" {...register(`periods.${idx}.subject`)} />
                    <Select
                      placeholder="Subject"
                      data={subjectOptions}
                      value={periods[idx]?.subject || ''}
                      onChange={(value) => setValue(`periods.${idx}.subject`, value || '')}
                      searchable
                      clearable
                    />
                  </td>
                  <td>
                    <input type="hidden" {...register(`periods.${idx}.subject_teacher_id`)} />
                    <Select
                      placeholder="Subject teacher"
                      data={teacherOptions}
                      value={periods[idx]?.subject_teacher_id || ''}
                      onChange={(value) => setValue(`periods.${idx}.subject_teacher_id`, value || '')}
                      searchable
                      clearable
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Checkbox {...register(`periods.${idx}.signed`)} />
                  </td>
                  <td>
                    <Textarea minRows={1} autosize placeholder="Remarks" {...register(`periods.${idx}.remarks`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
        <Space h="md" />
        <Group position="right">
          <Button type="submit">Submit</Button>
        </Group>
      </form>
    </Card>
  )
}
