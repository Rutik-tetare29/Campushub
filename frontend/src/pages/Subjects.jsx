import React, { useEffect, useState } from 'react'
import { Paper, Typography, List, ListItem, ListItemText, Button, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material'
import API from '../api'

export default function Subjects(){
  const [subjects, setSubjects] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [credits, setCredits] = useState(3)
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const fetch = async ()=>{
    try {
      const res = await API.get('/subjects')
      setSubjects(res.data)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(()=>{ fetch() }, [])

  const submit = async e => {
    e.preventDefault()
    try{
      await API.post('/subjects', { name, code, description, credits })
      setName(''); setCode(''); setDescription(''); setCredits(3)
      fetch()
    }catch(err){
      alert(err?.response?.data?.message || 'Could not create subject')
    }
  }

  const canCreate = user && (user.role === 'teacher' || user.role === 'admin')

  return (
    <Paper sx={{ p:4 }}>
      <Typography variant='h5' mb={2}>Subjects</Typography>
      
      {canCreate && (
        <form onSubmit={submit}>
          <Stack spacing={2} mb={3}>
            <TextField label='Subject Name' value={name} onChange={e=>setName(e.target.value)} required />
            <TextField label='Subject Code' value={code} onChange={e=>setCode(e.target.value)} required />
            <TextField label='Description' multiline rows={2} value={description} onChange={e=>setDescription(e.target.value)} />
            <TextField label='Credits' type='number' value={credits} onChange={e=>setCredits(e.target.value)} />
            <Button type='submit' variant='contained'>Add Subject</Button>
          </Stack>
        </form>
      )}

      <List>
        {subjects.map(s => (
          <ListItem key={s._id} divider>
            <ListItemText 
              primary={`${s.code} - ${s.name}`} 
              secondary={`${s.description || ''} | Credits: ${s.credits} | Teacher: ${s.teacher?.name || 'N/A'}`} 
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
