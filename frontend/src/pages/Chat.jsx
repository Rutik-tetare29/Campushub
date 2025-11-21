import React, { useContext, useEffect, useState } from 'react'
import { Paper, Typography, Stack, TextField, Button, List, ListItem, ListItemText, Box, Chip } from '@mui/material'
import API from '../api'
import { SocketContext } from '../App'

export default function Chat(){
  const socket = useContext(SocketContext)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [room] = useState('general') // could add room selector later
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const fetch = async ()=>{
    try {
      const res = await API.get(`/messages?room=${room}`)
      setMessages(res.data)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(()=>{ 
    fetch()
    socket.emit('join', room)
    
    socket.on('new_message', msg => {
      if (msg.room === room) {
        setMessages(m => [...m, msg])
      }
    })

    return ()=>{
      socket.off('new_message')
      socket.emit('leave', room)
    }
  }, [room, socket])

  const submit = async e => {
    e.preventDefault()
    if (!content.trim()) return
    
    console.log('📤 Sending message:', content, 'to room:', room)
    console.log('👤 Current user:', user)
    console.log('🔑 Token exists:', !!localStorage.getItem('token'))
    
    try{
      const response = await API.post('/messages', { content, room })
      console.log('✅ Message sent successfully:', response.data)
      setContent('')
      // Optionally add the message immediately to messages array
      // setMessages(m => [...m, response.data])
    }catch(err){
      console.error('❌ Failed to send message:', err)
      console.error('Error response:', err?.response?.data)
      console.error('Error status:', err?.response?.status)
      alert(err?.response?.data?.message || `Could not send message: ${err.message}`)
    }
  }

  return (
    <Paper sx={{ p:4, height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant='h5' mb={2}>Chat / Forum - {room}</Typography>
      
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
        <List>
          {messages.map(msg => (
            <ListItem key={msg._id} alignItems='flex-start' sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <Chip 
                  label={msg.sender?.name || 'Unknown'} 
                  size='small' 
                  color={msg.sender?.role === 'teacher' ? 'primary' : msg.sender?.role === 'admin' ? 'secondary' : 'default'}
                />
                <Typography variant='caption' color='text.secondary'>
                  {new Date(msg.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant='body1'>{msg.content}</Typography>
            </ListItem>
          ))}
        </List>
      </Box>

      <form onSubmit={submit}>
        <Stack direction='row' spacing={1}>
          <TextField 
            fullWidth 
            placeholder='Type your message...' 
            value={content} 
            onChange={e=>setContent(e.target.value)}
            multiline
            maxRows={3}
          />
          <Button type='submit' variant='contained'>Send</Button>
        </Stack>
      </form>
    </Paper>
  )
}
