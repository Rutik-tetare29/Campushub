import React, { useEffect, useState } from 'react'
import { Paper, Typography, List, ListItem, ListItemText, Button, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import API from '../api'
import { toast } from 'react-toastify'

export default function Subjects(){
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [credits, setCredits] = useState(3)
  const [department, setDepartment] = useState('')
  const [semester, setSemester] = useState('')
  const [assignedTeacher, setAssignedTeacher] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Biotechnology'
  ]

  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8']

  const fetch = async ()=>{
    try {
      const res = await API.get('/subjects')
      setSubjects(res.data)
    } catch(err) {
      console.error(err)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await API.get('/subjects/teachers')
      setTeachers(res.data)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(()=>{ 
    fetch()
    if (user?.role === 'admin') {
      fetchTeachers()
    }
  }, [])

  const submit = async e => {
    e.preventDefault()
    
    if (!department || !semester) {
      toast.error('Department and semester are required')
      return
    }
    
    try{
      await API.post('/subjects', { 
        name, 
        code, 
        description, 
        credits,
        department,
        semester,
        assignedTeacher: assignedTeacher || null
      })
      setName(''); setCode(''); setDescription(''); setCredits(3)
      setDepartment(''); setSemester(''); setAssignedTeacher('')
      toast.success('Subject created successfully')
      fetch()
    }catch(err){
      toast.error(err?.response?.data?.message || 'Could not create subject')
    }
  }

  const handleAssignTeacher = (subject) => {
    setSelectedSubject(subject)
    setAssignedTeacher(subject.assignedTeacher?._id || '')
    setOpenDialog(true)
  }

  const saveTeacherAssignment = async () => {
    try {
      await API.put(`/subjects/${selectedSubject._id}/assign-teacher`, {
        teacherId: assignedTeacher || null
      })
      toast.success('Teacher assigned successfully')
      setOpenDialog(false)
      setSelectedSubject(null)
      setAssignedTeacher('')
      fetch()
    } catch(err) {
      toast.error(err?.response?.data?.message || 'Failed to assign teacher')
    }
  }

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Are you sure you want to delete "${subject.name}"?\n\nThis will also delete all associated schedules.`)) {
      return
    }
    
    try {
      const res = await API.delete(`/subjects/${subject._id}`)
      toast.success(`Subject deleted successfully${res.data.deletedSchedules > 0 ? ` (${res.data.deletedSchedules} schedules removed)` : ''}`)
      fetch()
    } catch(err) {
      toast.error(err?.response?.data?.message || 'Failed to delete subject')
    }
  }

  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isStudent = user?.role === 'student'

  return (
    <Paper sx={{ p:4 }}>
      <Typography variant='h5' mb={2}>
        {isAdmin ? 'Manage Subjects' : isTeacher ? 'My Assigned Subjects' : 'My Subjects'}
      </Typography>
      
      {isAdmin && (
        <form onSubmit={submit}>
          <Stack spacing={2} mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField 
                  label='Subject Name' 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  required 
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label='Subject Code' 
                  value={code} 
                  onChange={e=>setCode(e.target.value)} 
                  required 
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    label='Department'
                  >
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    label='Semester'
                  >
                    {semesters.map(sem => (
                      <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label='Credits' 
                  type='number' 
                  value={credits} 
                  onChange={e=>setCredits(e.target.value)} 
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label='Description' 
                  multiline 
                  rows={2} 
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Teacher (Optional)</InputLabel>
                  <Select
                    value={assignedTeacher}
                    onChange={e => setAssignedTeacher(e.target.value)}
                    label='Assign Teacher (Optional)'
                  >
                    <MenuItem value="">None</MenuItem>
                    {teachers.map(teacher => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.department || 'N/A'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Button type='submit' variant='contained' size='large'>
              Add Subject
            </Button>
          </Stack>
        </form>
      )}

      {subjects.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {isStudent ? 'No subjects available for your department and semester' : 
           isTeacher ? 'No subjects assigned to you yet' : 
           'No subjects created yet'}
        </Typography>
      ) : (
        <List>
          {subjects.map(s => (
            <ListItem 
              key={s._id} 
              divider
              secondaryAction={
                isAdmin && (
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleAssignTeacher(s)}
                    >
                      {s.assignedTeacher ? 'Change Teacher' : 'Assign Teacher'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      color="error"
                      onClick={() => handleDeleteSubject(s)}
                    >
                      Delete
                    </Button>
                  </Stack>
                )
              }
            >
              <ListItemText 
                primary={
                  <Typography variant="h6">
                    {s.code} - {s.name}
                  </Typography>
                }
                secondary={
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {s.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={`${s.department || 'N/A'}`} size="small" color="primary" variant="outlined" />
                      <Chip label={`Sem ${s.semester || 'N/A'}`} size="small" color="secondary" variant="outlined" />
                      <Chip label={`${s.credits} Credits`} size="small" />
                      {s.assignedTeacher && (
                        <Chip 
                          label={`Teacher: ${s.assignedTeacher.name}`} 
                          size="small" 
                          color="success"
                        />
                      )}
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Assign Teacher Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Teacher to Subject
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSubject && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body1">
                <strong>Subject:</strong> {selectedSubject.code} - {selectedSubject.name}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Teacher</InputLabel>
                <Select
                  value={assignedTeacher}
                  onChange={e => setAssignedTeacher(e.target.value)}
                  label='Select Teacher'
                >
                  <MenuItem value="">None (Unassign)</MenuItem>
                  {teachers.map(teacher => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.name} {teacher.email && `(${teacher.email})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={saveTeacherAssignment} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
