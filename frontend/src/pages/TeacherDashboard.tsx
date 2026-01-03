import React, { useEffect, useState } from 'react'
import { Title, Card, Table, Space, Text } from '@mantine/core'
import { fetchSubjects, fetchClassrooms, fetchTeachers } from '../api'
import { useAuth } from '../hooks/useAuth'

export default function TeacherDashboard(){
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  useEffect(()=>{ load() }, [])

  async function load(){
    try{
      const [sRes, cRes, tRes] = await Promise.all([fetchSubjects(), fetchClassrooms(), fetchTeachers()])
      setSubjects(sRes.data)
      setClassrooms(cRes.data)
      setTeachers(tRes.data)
    }catch(err){ console.error(err) }
  }

  const mySubjects = subjects.filter(s=> (s.teacher_ids||[]).map((t:any)=>String(t)).includes(user?.id))
  const myClassrooms = classrooms.filter(c=> String(c.class_teacher_id) === String(user?.id))

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
    </div>
  )
}
