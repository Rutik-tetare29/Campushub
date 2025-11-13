import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Paper, Typography, Stack } from '@mui/material'
import API from '../api'

export default function Signup({ setUser }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    try{
      const res = await API.post('/auth/register', { name, email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      navigate('/')
    }catch(err){
      alert(err?.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <Paper sx={{ p:4, maxWidth:480, mx:'auto' }}>
      <Typography variant='h5' mb={2}>Signup</Typography>
      <form onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label='Full name' value={name} onChange={e=>setName(e.target.value)} />
          <TextField label='Email' value={email} onChange={e=>setEmail(e.target.value)} />
          <TextField label='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} />
          <Button type='submit' variant='contained'>Signup</Button>
        </Stack>
      </form>
    </Paper>
  )
}
