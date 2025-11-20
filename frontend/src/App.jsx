import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Container } from '@mui/material'
import io from 'socket.io-client'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Notices from './pages/Notices'
import Uploads from './pages/Uploads'
import Subjects from './pages/Subjects'
import Schedule from './pages/Schedule'
import Chat from './pages/Chat'
import AdminPanel from './pages/AdminPanel'
import Profile from './pages/Profile'
import Header from './components/Header'

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000')

export const SocketContext = React.createContext(socket)

export default function App(){
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const navigate = useNavigate()

  useEffect(()=>{
    if (user) socket.emit('join', user.id)
  },[user])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <SocketContext.Provider value={socket}>
      {user && <Header user={user} onLogout={handleLogout} />}
      {user ? (
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path='/' element={<Dashboard user={user} setUser={setUser} />} />
            <Route path='/dashboard' element={<Dashboard user={user} setUser={setUser} />} />
            <Route path='/notices' element={<Notices />} />
            <Route path='/uploads' element={<Uploads />} />
            <Route path='/subjects' element={<Subjects />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/chat' element={<Chat />} />
            <Route path='/admin' element={<AdminPanel />} />
            <Route path='/profile' element={<Profile />} />
          </Routes>
        </Container>
      ) : (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login setUser={setUser} />} />
          <Route path='/signup' element={<Signup setUser={setUser} />} />
          <Route path='*' element={<Home />} />
        </Routes>
      )}
    </SocketContext.Provider>
  )
}

