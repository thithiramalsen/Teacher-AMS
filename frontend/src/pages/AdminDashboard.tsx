import React, { useEffect, useState, useRef } from 'react'
import { Card, Title, Group, Button, Table, Space, Text, Modal, TextInput, Select, MultiSelect, Badge, Accordion } from '@mantine/core'
import { Link } from 'react-router-dom'
import { fetchSubjects, fetchClassrooms, fetchTeachers, createSubject, deleteSubject, createClassroom, deleteClassroom, setSubjectTeachers, assignClassroom, fetchReports } from '../api'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard(){
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [allReports, setAllReports] = useState<any[]>([])
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showClassroomModal, setShowClassroomModal] = useState(false)
  const [newClassroomName, setNewClassroomName] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [subjectTeacherSelection, setSubjectTeacherSelection] = useState<string[]>([])
  const [assignClassroomId, setAssignClassroomId] = useState<string | null>(null)
  const [assignClassTeacher, setAssignClassTeacher] = useState<string | null>(null)
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([])
  const subjectModalRef = useRef<HTMLDivElement | null>(null)
  const classroomModalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load(){
    try{
      const [sRes, cRes, tRes, rRes] = await Promise.all([fetchSubjects(), fetchClassrooms(), fetchTeachers(), fetchReports()])
      setSubjects(sRes.data)
      setClassrooms(cRes.data)
      setTeachers(tRes.data)
      setAllReports(rRes.data || [])
    }catch(err){
      console.error(err)
    }
  }

  // helpers to map ids to friendly labels
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

  async function handleCreateSubject(){
    if(!newSubjectName) return
    await createSubject({ name: newSubjectName })
    setNewSubjectName('')
    setShowSubjectModal(false)
    load()
  }

  async function handleDeleteSubject(id: string){
    if(!confirm('Delete subject?')) return
    await deleteSubject(id)
    load()
  }

  async function handleCreateClassroom(){
    if(!newClassroomName) return
    await createClassroom({ name: newClassroomName })
    setNewClassroomName('')
    setShowClassroomModal(false)
    load()
  }

  async function handleDeleteClassroom(id: string){
    if(!confirm('Delete classroom?')) return
    await deleteClassroom(id)
    load()
  }

  async function openSubjectAssign(id: string){
    setSelectedSubject(id)
    const subj = subjects.find(s=>s._id===id)
    setSubjectTeacherSelection(subj?.teacher_ids?.map((t:any)=>String(t)) || [])
  }

  useEffect(()=>{
    if(selectedSubject && subjectModalRef.current){
      // small delay to let modal render, then scroll to top so the first field is visible
      setTimeout(()=>subjectModalRef.current && subjectModalRef.current.scrollTo({ top: 0 }), 50)
    }
  }, [selectedSubject])

  async function saveSubjectTeachers(){
    if(!selectedSubject) return
    await setSubjectTeachers(selectedSubject, subjectTeacherSelection)
    setSelectedSubject(null)
    load()
  }

  async function openClassroomAssign(id: string){
    setAssignClassroomId(id)
    const c = classrooms.find(x=>x._id===id)
    setAssignClassTeacher(c?.class_teacher_id || null)
    setAssignSubjectIds(c?.subject_ids?.map((s:any)=>String(s))||[])
  }

  useEffect(()=>{
    if(assignClassroomId && classroomModalRef.current){
      setTimeout(()=>classroomModalRef.current && classroomModalRef.current.scrollTo({ top: 0 }), 50)
    }
  }, [assignClassroomId])

  async function saveClassroomAssign(){
    if(!assignClassroomId) return
    await assignClassroom(assignClassroomId, { class_teacher_id: assignClassTeacher || null, subject_ids: assignSubjectIds })
    setAssignClassroomId(null)
    load()
  }

  return (
    <div>
      <Group position="apart">
        <Title order={2}>Admin Dashboard</Title>
        <div>
          <Button onClick={()=>setShowSubjectModal(true)} mr="sm">New Subject</Button>
          <Button onClick={()=>setShowClassroomModal(true)}>New Classroom</Button>
        </div>
      </Group>

      <Space h="md" />

      <Card shadow="sm" p="md">
        <Title order={4}>Subjects</Title>
        <Table>
          <thead>
            <tr><th>Name</th><th>Teachers</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {subjects.map(s=> (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{(s.teacher_ids||[]).map((t:any)=>teacherLabel(t)).join(', ')}</td>
                <td>
                  <Button size="xs" onClick={()=>openSubjectAssign(s._id)} mr="sm">Assign Teachers</Button>
                  <Button size="xs" color="red" onClick={()=>handleDeleteSubject(s._id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Space h="md" />

      <Card shadow="sm" p="md">
        <Title order={4}>Classrooms</Title>
        <Table>
          <thead>
            <tr><th>Name</th><th>Class Teacher</th><th>Subjects</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {classrooms.map(c=> (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{teacherLabel(c.class_teacher_id)}</td>
                <td>{(c.subject_ids||[]).map((id:any)=>subjectName(id)).join(', ')}</td>
                <td>
                  <Button size="xs" onClick={()=>openClassroomAssign(c._id)} mr="sm">Assign</Button>
                  <Button size="xs" color="red" onClick={()=>handleDeleteClassroom(c._id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Space h="md" />

      <Card shadow="sm" p="md">
        <Title order={4}>Daily Reports</Title>
        {reportsByDate.length === 0 ? (
          <Text color="dimmed">No reports yet</Text>
        ) : (
          <Accordion multiple>
            {reportsByDate.map(([date, reports]) => (
              <Accordion.Item value={date} key={date}>
                <Accordion.Control>{date} <Badge ml="sm" color="indigo" variant="light">{reports.length}</Badge></Accordion.Control>
                <Accordion.Panel>
                  <Table>
                    <thead>
                      <tr><th>Class</th><th>Status</th><th>Signed Periods</th><th>Updated</th><th>Action</th></tr>
                    </thead>
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

      <Modal opened={showSubjectModal} onClose={()=>setShowSubjectModal(false)} title="Create Subject" size="lg">
        <TextInput label="Name" value={newSubjectName} onChange={(e)=>setNewSubjectName(e.currentTarget.value)} />
        <Space h="sm" />
        <Button onClick={handleCreateSubject}>Create</Button>
      </Modal>

      <Modal opened={showClassroomModal} onClose={()=>setShowClassroomModal(false)} title="Create Classroom" size="lg">
        <TextInput label="Name" value={newClassroomName} onChange={(e)=>setNewClassroomName(e.currentTarget.value)} />
        <Space h="sm" />
        <Button onClick={handleCreateClassroom}>Create</Button>
      </Modal>

      <Modal opened={!!selectedSubject} onClose={()=>setSelectedSubject(null)} title="Assign Teachers to Subject" size="lg" centered>
        <div ref={subjectModalRef} style={{ maxHeight: '50vh', overflow: 'auto', paddingTop: 24, paddingBottom: 12, boxSizing: 'border-box' }}>
          <Text size="sm" fw={500} mb={4}>Teachers</Text>
          <MultiSelect
            placeholder="Select multiple teachers"
            data={teachers.map(t=>({ value: t.id, label: `${t.name} (${t.display_id||t.id.slice(0,4)+'...'+t.id.slice(-4)})` }))}
            value={subjectTeacherSelection as any}
            onChange={(v)=>setSubjectTeacherSelection(v as string[])}
            searchable
            clearable
            withinPortal={true}
            styles={{ dropdown: { zIndex: 9999 } }}
          />
          <Space h="sm" />
          <Button onClick={saveSubjectTeachers}>Save</Button>
        </div>
      </Modal>

      <Modal opened={!!assignClassroomId} onClose={()=>setAssignClassroomId(null)} title="Assign Classroom" size="xl" centered>
        <div ref={classroomModalRef} style={{ maxHeight: '70vh', overflow: 'auto', paddingTop: 32, paddingBottom: 12 }}>
          <Select
            label="Class teacher"
            data={teachers.map(t=>({ value: t.id, label: `${t.name} (${t.display_id||t.id.slice(0,4)+'...'+t.id.slice(-4)})` }))}
            value={assignClassTeacher as any || undefined}
            onChange={(v: any)=>setAssignClassTeacher(v || null)}
            searchable
            clearable
            withinPortal={true}
            styles={{ dropdown: { zIndex: 9999 } }}
          />
          <Space h="sm" />
          <Text size="sm" fw={500} mb={4}>Subjects</Text>
          <MultiSelect
            placeholder="Select subjects"
            data={subjects.map(s=>({ value: s._id, label: s.name }))}
            value={assignSubjectIds as any}
            onChange={(v)=>setAssignSubjectIds(v as string[])}
            searchable
            clearable
            withinPortal={true}
            styles={{ dropdown: { zIndex: 9999 } }}
          />
          <Space h="sm" />
          <Button onClick={saveClassroomAssign}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
