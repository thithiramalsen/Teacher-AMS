import React, { useEffect, useState } from 'react'
import { Title, Card, Table, Space, Text, Accordion, Badge, Button } from '@mantine/core'
import { Link } from 'react-router-dom'
import { fetchSubjects, fetchClassrooms, fetchTeachers, fetchReports } from '../api'
import { useAuth } from '../hooks/useAuth'

export default function TeacherDashboard(){
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [allReports, setAllReports] = useState<any[]>([])

  useEffect(()=>{ load() }, [user])

  async function load(){
    if(!user) return
    try{
      const [sRes, cRes, tRes, rRes] = await Promise.all([
        fetchSubjects(),
        fetchClassrooms(),
        fetchTeachers(),
        fetchReports(),
      ])
      setSubjects(sRes.data)
      setClassrooms(cRes.data)
      setTeachers(tRes.data)
      setAllReports(rRes.data || [])
    }catch(err){ console.error(err) }
  }

  const mySubjects = subjects.filter(s=> (s.teacher_ids||[]).map((t:any)=>String(t)).includes(user?.id))
  const myClassrooms = classrooms.filter(c=> String(c.class_teacher_id) === String(user?.id))

  const reportsByDate = React.useMemo(() => {
    const map = new Map<string, any[]>()
    allReports.forEach((r:any) => {
      const key = r.date
      if(!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    })
    return Array.from(map.entries()).sort((a,b)=> new Date(b[0]).getTime() - new Date(a[0]).getTime())
  }, [allReports])

  const classLabel = (id: string) => {
    const c = classrooms.find((x:any)=>String(x._id)===String(id))
    return c ? c.name : id
  }

  const teacherLabel = (id: string | null | undefined) => {
    if (!id) return '-'
    const t = teachers.find((x:any) => String(x.id) === String(id))
    if (!t) return String(id).slice(0,6) + '...'
    return `${t.name} (${t.display_id || String(t.id).slice(0,6)})`
  }

  const subjectName = (id: string | null | undefined) => {
    if (!id) return '-'
    const s = subjects.find((x:any) => String(x._id) === String(id))
    return s ? s.name : String(id).slice(0,6) + '...'
  }

  return (
    <div>
      <Title order={2}>Teacher Dashboard</Title>
      <Space h="md" />

      <Card shadow="sm" p="md" mb="md">
        <Title order={4}>Assigned Subjects</Title>
        {mySubjects.length === 0 ? <Text color="dimmed">No assigned subjects</Text> : (
          <Table>
            <thead><tr><th>Name</th><th>Teachers</th></tr></thead>
            <tbody>
              {mySubjects.map(s=>(<tr key={s._id}><td>{s.name}</td><td>{(s.teacher_ids||[]).map((t:any)=>teacherLabel(t)).join(', ')}</td></tr>))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card shadow="sm" p="md">
        <Title order={4}>Assigned Classrooms</Title>
        {myClassrooms.length === 0 ? <Text color="dimmed">No assigned classrooms</Text> : (
          <Table>
            <thead><tr><th>Name</th><th>Class Teacher</th><th>Subjects</th></tr></thead>
            <tbody>
              {myClassrooms.map(c=>(<tr key={c._id}><td>{c.name}</td><td>{teacherLabel(c.class_teacher_id)}</td><td>{(c.subject_ids||[]).map((id:any)=>subjectName(id)).join(', ')}</td></tr>))}
            </tbody>
          </Table>
        )}
      </Card>

      <Space h="md" />

      <Card shadow="sm" p="md">
        <Title order={4}>My Reports</Title>
        {reportsByDate.length === 0 ? (
          <Text color="dimmed">No reports yet</Text>
        ) : (
          <Accordion multiple>
            {reportsByDate.map(([date, reports]) => (
              <Accordion.Item value={date} key={date}>
                <Accordion.Control>{date} <Badge ml="sm" color="indigo" variant="light">{reports.length}</Badge></Accordion.Control>
                <Accordion.Panel>
                  <Table>
                    <thead><tr><th>Class</th><th>Status</th><th>Signed Periods</th><th>Updated</th><th>Action</th></tr></thead>
                    <tbody>
                      {reports.map((r:any)=>(
                        <tr key={r.id}>
                          <td>{classLabel(r.class_name)}</td>
                          <td><Badge color={r.status==='submitted'?'teal':'orange'} variant="light">{r.status}</Badge></td>
                          <td>{r.total_periods_taught}</td>
                          <td>{r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'}</td>
                          <td>
                            <Button component={Link} to={`/reports/new?class_name=${encodeURIComponent(r.class_name)}&date=${encodeURIComponent(r.date)}`} size="xs" variant="subtle">Open</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Card>
    </div>
  )
}
