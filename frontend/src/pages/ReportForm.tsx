import React, { useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { createReport } from '../hooks/useReports'
import { useNavigate } from 'react-router-dom'
import { Card, TextInput, Checkbox, Button, Textarea, Grid, Group, Title, Space, Table, Text, ScrollArea } from '@mantine/core'

export default function ReportForm(){
  const { register, control, handleSubmit } = useForm<any>({
    defaultValues: { periods: Array.from({length:8}, (_,i)=>({ period_number: i+1, subject: '', topic: '', subject_teacher_id: '', signed: false, remarks: '' })) }
  })
  const { fields } = useFieldArray<any>({ control, name: 'periods' })
  const navigate = useNavigate()
  const periods = (control._formValues as any)?.periods || []
  const totalTaught = useMemo(() => {
    const list = Array.isArray(periods) ? periods : []
    return list.reduce((acc, p) => acc + (p?.signed ? 1 : 0), 0)
  }, [periods])

  async function onSubmit(data: any){
    try{
      const resp = await createReport(data)
      alert('Created: ' + resp.id)
      navigate('/')
    }catch(err){
      alert('Failed to create report')
    }
  }

  return (
    <Card shadow="sm" padding="lg" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Title order={2}>New Daily Report</Title>
      <Space h="md" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid align="end" gutter="md">
          <Grid.Col span={4}>
            <TextInput label="Date" type="date" {...register('date')} required />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput label="Class teacher signature" placeholder="Name or ID" {...register('class_teacher_id')} required />
          </Grid.Col>
          <Grid.Col span={4}>
            <Group position="apart" align="center">
              <Text weight={600}>Total periods taught</Text>
              <Text size="xl" weight={700}>{totalTaught}</Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput label="Class name" placeholder="e.g., Grade 10-A" {...register('class_name')} required />
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
                    <TextInput
                      {...register(`periods.${idx}.period_number`)}
                      value={idx + 1}
                      readOnly
                    />
                  </td>
                  <td>
                    <Textarea minRows={1} autosize placeholder="Topic" {...register(`periods.${idx}.topic`)} />
                  </td>
                  <td>
                    <TextInput placeholder="Subject" {...register(`periods.${idx}.subject`)} />
                  </td>
                  <td>
                    <TextInput placeholder="Teacher ID" {...register(`periods.${idx}.subject_teacher_id`)} />
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
