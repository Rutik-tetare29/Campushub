import React, { useEffect, useState } from 'react'
import { Paper, Typography, Button, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'
import API from '../api'

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Schedule(){
  const [schedules, setSchedules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subject, setSubject] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [room, setRoom] = useState('')
  const [semester, setSemester] = useState('')
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const fetch = async ()=>{
    try {
      const [schRes, subRes] = await Promise.all([API.get('/schedules'), API.get('/subjects')])
      setSchedules(schRes.data)
      setSubjects(subRes.data)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(()=>{ fetch() }, [])

  const submit = async e => {
    e.preventDefault()
    try{
      await API.post('/schedules', { subject, dayOfWeek, startTime, endTime, room, semester })
      setSubject(''); setStartTime(''); setEndTime(''); setRoom(''); setSemester('')
      fetch()
    }catch(err){
      alert(err?.response?.data?.message || 'Could not create schedule')
    }
  }

  const canCreate = user && (user.role === 'teacher' || user.role === 'admin')

  const groupedByDay = days.map(day => ({
    day,
    classes: schedules.filter(s => s.dayOfWeek === day)
  }))

  return (
    <Paper sx={{ p:4 }}>
      <Typography variant='h5' mb={2}>Class Schedule</Typography>
      
      {canCreate && (
        <form onSubmit={submit}>
          <Stack spacing={2} mb={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select value={subject} onChange={e=>setSubject(e.target.value)} required>
                {subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.code} - {s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Day</InputLabel>
              <Select value={dayOfWeek} onChange={e=>setDayOfWeek(e.target.value)}>
                {days.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label='Start Time (e.g. 09:00)' value={startTime} onChange={e=>setStartTime(e.target.value)} required />
            <TextField label='End Time (e.g. 10:30)' value={endTime} onChange={e=>setEndTime(e.target.value)} required />
            <TextField label='Room' value={room} onChange={e=>setRoom(e.target.value)} />
            <TextField label='Semester' value={semester} onChange={e=>setSemester(e.target.value)} />
            <Button type='submit' variant='contained'>Add Schedule</Button>
          </Stack>
        </form>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Day</strong></TableCell>
            <TableCell><strong>Time</strong></TableCell>
            <TableCell><strong>Subject</strong></TableCell>
            <TableCell><strong>Room</strong></TableCell>
            <TableCell><strong>Teacher</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groupedByDay.map(({ day, classes }) => 
            classes.length > 0 ? classes.map((c, idx) => (
              <TableRow key={c._id}>
                {idx === 0 && <TableCell rowSpan={classes.length}><strong>{day}</strong></TableCell>}
                <TableCell>{c.startTime} - {c.endTime}</TableCell>
                <TableCell>{c.subject?.code} - {c.subject?.name}</TableCell>
                <TableCell>{c.room || '-'}</TableCell>
                <TableCell>{c.subject?.teacher?.name || '-'}</TableCell>
              </TableRow>
            )) : (
              <TableRow key={day}>
                <TableCell><strong>{day}</strong></TableCell>
                <TableCell colSpan={4}>No classes</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Paper>
  )
}
