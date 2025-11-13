import React, { useEffect, useState } from 'react'
import { Paper, Typography, List, ListItem, ListItemText, Button, Stack, TextField, Alert } from '@mui/material'
import API from '../api'

export default function Notices(){
  const [notices, setNotices] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get user from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user'))
      setUser(userData)
    } catch (err) {
      console.error('Error parsing user data:', err)
    }
  }, [])

  const fetch = async ()=>{
    const res = await API.get('/notices')
    setNotices(res.data)
  }

  useEffect(()=>{ fetch() }, [])

  const submit = async e => {
    e.preventDefault()
    try{
      await API.post('/notices', { title, content })
      setTitle(''); setContent('')
      fetch()
    }catch(err){
      alert(err?.response?.data?.message || 'Could not create notice')
    }
  }

  // Check if user is teacher or admin
  const canCreateNotice = user && (user.role === 'teacher' || user.role === 'admin')

  return (
    <Paper sx={{ p:4 }}>
      <Typography variant='h5' mb={2}>Notices</Typography>
      
      {canCreateNotice ? (
        <form onSubmit={submit}>
          <Stack spacing={2} mb={2}>
            <TextField label='Title' value={title} onChange={e=>setTitle(e.target.value)} required />
            <TextField label='Content' multiline rows={3} value={content} onChange={e=>setContent(e.target.value)} required />
            <Button type='submit' variant='contained'>Create Notice</Button>
          </Stack>
        </form>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only teachers and administrators can create notices.
        </Alert>
      )}

      <List>
        {notices.map(n => (
          <ListItem key={n._id} divider>
            <ListItemText primary={n.title} secondary={`${new Date(n.createdAt).toLocaleString()} — ${n.content || ''}`} />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
