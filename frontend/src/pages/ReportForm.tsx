import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { Card, TextInput, Button, Textarea, Grid, Group, Title, Space, Table, Text, ScrollArea, Badge, Select, Tooltip } from '@mantine/core'
import toast from 'react-hot-toast'
import { FileEdit, CheckCircle2, MinusCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchSubjects, fetchClassrooms, fetchTeachers, upsertReport, fetchReportByClassAndDate, signReportPeriod, submitReportFinal } from '../api'

const formatObjectId = (id?: string) => {
  if (!id) return ''
  if (id.length <= 8) return id
  return `${id.slice(0, 4)}...${id.slice(-4)}`
}

export default function ReportForm(){
  const { user } = useAuth()
  const { register, control, handleSubmit, watch, setValue } = useForm<any>({
    defaultValues: { periods: Array.from({length:8}, (_,i)=>({ period_number: i+1, subject: '', topic: '', subject_teacher_id: '', signature_status: 'absent', remarks: '' })) }
  })
  const [searchParams] = useSearchParams()
  const { fields } = useFieldArray<any>({ control, name: 'periods' })
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([])
  const [classroomOptions, setClassroomOptions] = useState<{ value: string; label: string; classTeacherId?: string }[]>([])
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])
  const [reportId, setReportId] = useState<string | null>(null)
  const [statusLabel, setStatusLabel] = useState<string>('draft')
  const periods = watch('periods') || []
  const dateValue = watch('date')
  const totalTaught = useMemo(() => {
    const list = Array.isArray(periods) ? periods : []
    return list.reduce((acc, p) => acc + (p?.signature_status === 'signed' ? 1 : 0), 0)
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

  const classLabel = (id?: string) => {
    if (!id) return ''
    const found = classroomOptions.find(c => c.value === id)
    return found ? found.label : id
  }

  useEffect(() => {
    const classParam = searchParams.get('class_name')
    const dateParam = searchParams.get('date')
    if (classParam) setValue('class_name', classParam)
    if (dateParam) setValue('date', dateParam)
  }, [searchParams, setValue])

  useEffect(() => {
    if (!user) return
    const needsPeriodUpdate = (periods || []).some((p: any) => !p?.subject_teacher_id)
    const needsClassUpdate = !watch('class_teacher_id')
    if (needsClassUpdate) setValue('class_teacher_id', user.id)
    if (needsPeriodUpdate) {
      const updated = (periods || []).map((p: any, idx: number) => ({
        ...p,
        period_number: idx + 1,
        subject_teacher_id: p.subject_teacher_id || user.id,
        signature_status: p.signature_status || 'absent',
      }))
      setValue('periods', updated)
    }
  }, [user, setValue, periods, watch])

  useEffect(() => {
    async function loadLists() {
      try {
        const [subjectsRes, classroomsRes, teachersRes] = await Promise.all([
          fetchSubjects(),
          fetchClassrooms(),
          fetchTeachers(),
        ])
        const allSubjects = subjectsRes.data || []
        const assigned = user?.role === 'teacher'
          ? allSubjects.filter((s: any) => (s.teacher_ids || []).map((t: any)=>String(t)).includes(String(user.id)))
          : allSubjects
        const subjectList = (assigned.length > 0 ? assigned : allSubjects).map((s: any) => ({ value: s._id, label: s.name }))
        setSubjectOptions(subjectList)
        setClassroomOptions(classroomsRes.data.map((c: any) => ({ value: c._id, label: c.name, classTeacherId: c.class_teacher_id })))
        setTeacherOptions(teachersRes.data.map((t: any) => ({ value: t.id, label: `${t.name} (${t.display_id || t.id.slice(0,4)+'...'+t.id.slice(-4)})` })))
      } catch (err) {
        // ignore for now; UI will show empty dropdowns
      }
    }
    loadLists()
  }, [])

  useEffect(() => {
    async function loadExisting(){
      if(!classNameValue || !dateValue) return
      try{
        const res = await fetchReportByClassAndDate(classNameValue, dateValue)
        if(res.data){
          const r = res.data
          setReportId(r.id)
          setStatusLabel(r.status)
          setValue('class_teacher_id', r.class_teacher_id)
          setValue('periods', r.periods.map((p: any, idx: number)=>({ ...p, period_number: idx+1 })))
          toast.success(`Loaded existing report for ${classLabel(classNameValue)} on ${dateValue}`)
        } else {
          setReportId(null)
          setStatusLabel('draft')
        }
      }catch(err){
        setReportId(null)
        setStatusLabel('draft')
      }
    }
    loadExisting()
  }, [classNameValue, dateValue, setValue])

  function normalizePeriods(list: any[]) {
    return (list || []).map((p: any, idx: number) => ({
      period_number: idx + 1,
      subject: p.subject || 'TBD',
      topic: p.topic || 'TBD',
      subject_teacher_id: p.subject_teacher_id || user?.id,
      signature_status: p.signature_status || 'absent',
      remarks: p.remarks || '',
    }))
  }

  async function saveDraft(data: any){
    const payload = {
      date: data.date,
      class_name: data.class_name,
      class_teacher_id: data.class_teacher_id || user?.id,
      status: 'draft',
      periods: normalizePeriods(data.periods),
    }
    const resp = await upsertReport(payload)
    setReportId(resp.data.id)
    setStatusLabel(resp.data.status)
    setValue('periods', resp.data.periods)
    return resp.data
  }

  async function onSubmit(data: any){
    try{
      await saveDraft(data)
      toast.success('Report saved')
    }catch(err){
      toast.error('Failed to save report. Please check all required fields.')
    }
  }

  async function handleSign(idx: number){
    if(!user) return
    const periodNumber = idx + 1
    const currentStatus = periods[idx]?.signature_status || 'absent'
    // If there's no local reportId yet, check if a report already exists for this class/date
    if(!reportId){
      try{
        const existing = await fetchReportByClassAndDate(classNameValue, dateValue)
        if(existing.data){
          // notify and load existing instead of creating duplicate
          toast('A report already exists for ' + classLabel(classNameValue) + ' on ' + dateValue + ' — opening existing report.', { icon: 'ℹ️' })
          const r = existing.data
          setReportId(r.id)
          setStatusLabel(r.status)
          setValue('class_teacher_id', r.class_teacher_id)
          setValue('periods', r.periods.map((p: any, idx: number)=>({ ...p, period_number: idx+1 })))
          return
        }
      }catch(err){
        // ignore and proceed to create draft
      }
      // create draft if none exists
      const current = { date: dateValue, class_name: classNameValue, class_teacher_id: watch('class_teacher_id'), periods }
      const saved = await saveDraft(current)
      // ensure reportId is set for signing
      setReportId(saved.id)
    }
    const targetStatus: 'absent' | 'signed' = currentStatus === 'signed' ? 'absent' : 'signed'
    const res = await signReportPeriod(reportId!, periodNumber, targetStatus)
    setReportId(res.data.id)
    setStatusLabel(res.data.status)
    setValue('periods', res.data.periods)
  }

  async function handleSubmitFinal(){
    if(!reportId){
      const data = { date: dateValue, class_name: classNameValue, class_teacher_id: watch('class_teacher_id'), periods }
      const draft = await saveDraft(data)
      setReportId(draft.id)
    }
    if(!reportId) return
    const res = await submitReportFinal(reportId)
    setStatusLabel(res.data.status)
    setValue('periods', res.data.periods)
    toast.success('Report submitted')
  }

  return (
    <Card shadow="lg" padding="xl" style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Group position="apart" align="center">
        <Title order={2} style={{ display:'flex', alignItems:'center', gap:8 }}><FileEdit size={22}/> New Daily Report</Title>
        <Badge color={statusLabel === 'submitted' ? 'teal' : 'indigo'} variant="filled">{statusLabel}</Badge>
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
                      data={user?.role === 'admin' ? teacherOptions : teacherOptions.filter(t => t.value === user?.id)}
                      value={periods[idx]?.subject_teacher_id || ''}
                      onChange={(value) => setValue(`periods.${idx}.subject_teacher_id`, value || '')}
                      searchable
                      clearable
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Tooltip label={periods[idx]?.signature_status === 'signed' ? 'Signed' : 'Mark present'}>
                      <Button size="xs" variant={periods[idx]?.signature_status === 'signed' ? 'light' : 'subtle'} color={periods[idx]?.signature_status === 'signed' ? 'teal' : 'gray'} onClick={()=>handleSign(idx)} leftIcon={periods[idx]?.signature_status === 'signed' ? <CheckCircle2 size={14}/> : <MinusCircle size={14}/> }>
                        {periods[idx]?.signature_status === 'signed' ? 'Signed' : 'Sign'}
                      </Button>
                    </Tooltip>
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
        <Group position="apart">
          <Button variant="light" onClick={handleSubmit(onSubmit)}>Save Draft</Button>
          <Button type="button" onClick={handleSubmitFinal} color="teal">Submit (class teacher/admin)</Button>
        </Group>
      </form>
    </Card>
  )
}
