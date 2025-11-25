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
  const [startHour, setStartHour] = useState('09')
  const [startMinute, setStartMinute] = useState('00')
  const [startPeriod, setStartPeriod] = useState('AM')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('00')
  const [endPeriod, setEndPeriod] = useState('AM')
  const [room, setRoom] = useState('')
  const [semester, setSemester] = useState('')
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (hour, minute, period) => {
    let h = parseInt(hour)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return `${h.toString().padStart(2, '0')}:${minute}`
  }

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
    const start = convertTo24Hour(startHour, startMinute, startPeriod)
    const end = convertTo24Hour(endHour, endMinute, endPeriod)
    try{
      await API.post('/schedules', { subject, dayOfWeek, startTime: start, endTime: end, room })
      setSubject('')
      setStartHour('09'); setStartMinute('00'); setStartPeriod('AM')
      setEndHour('10'); setEndMinute('00'); setEndPeriod('AM')
      setRoom('')
      fetch()
    }catch(err){
      alert(err?.response?.data?.message || 'Could not create schedule')
    }
  }

  const deleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return
    try {
      await API.delete(`/schedules/${id}`)
      fetch()
    } catch(err) {
      alert(err?.response?.data?.message || 'Could not delete schedule')
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
            
            {/* Start Time */}
            <Typography variant='subtitle2' color='text.secondary'>Start Time</Typography>
            <Stack direction='row' spacing={2}>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Hour</InputLabel>
                <Select value={startHour} onChange={e=>setStartHour(e.target.value)}>
                  {[...Array(12)].map((_, i) => {
                    const hour = (i + 1).toString().padStart(2, '0')
                    return <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Minute</InputLabel>
                <Select value={startMinute} onChange={e=>setStartMinute(e.target.value)}>
                  {['00', '15', '30', '45'].map(min => (
                    <MenuItem key={min} value={min}>{min}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Period</InputLabel>
                <Select value={startPeriod} onChange={e=>setStartPeriod(e.target.value)}>
                  <MenuItem value='AM'>AM</MenuItem>
                  <MenuItem value='PM'>PM</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* End Time */}
            <Typography variant='subtitle2' color='text.secondary'>End Time</Typography>
            <Stack direction='row' spacing={2}>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Hour</InputLabel>
                <Select value={endHour} onChange={e=>setEndHour(e.target.value)}>
                  {[...Array(12)].map((_, i) => {
                    const hour = (i + 1).toString().padStart(2, '0')
                    return <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Minute</InputLabel>
                <Select value={endMinute} onChange={e=>setEndMinute(e.target.value)}>
                  {['00', '15', '30', '45'].map(min => (
                    <MenuItem key={min} value={min}>{min}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Period</InputLabel>
                <Select value={endPeriod} onChange={e=>setEndPeriod(e.target.value)}>
                  <MenuItem value='AM'>AM</MenuItem>
                  <MenuItem value='PM'>PM</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <TextField label='Room' value={room} onChange={e=>setRoom(e.target.value)} />
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
            {user?.role === 'admin' && <TableCell><strong>Actions</strong></TableCell>}
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
                <TableCell>{c.teacher?.name || c.subject?.assignedTeacher?.name || '-'}</TableCell>
                {user?.role === 'admin' && (
                  <TableCell>
                    <button onClick={() => deleteSchedule(c._id)} style={{color: 'red', cursor: 'pointer'}}>Delete</button>
                  </TableCell>
                )}
              </TableRow>
            )) : (
              <TableRow key={day}>
                <TableCell><strong>{day}</strong></TableCell>
                <TableCell colSpan={user?.role === 'admin' ? 5 : 4}>No classes</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Paper>
  )
}
