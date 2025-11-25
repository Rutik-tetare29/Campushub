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
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import Grades from './pages/Grades'
import Attendance from './pages/Attendance'
import StudentQRGeneration from './pages/StudentQRGeneration'
import CalendarPage from './pages/CalendarPage'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import ChatRoomsPage from './pages/ChatRoomsPage'
import VideoConference from './pages/VideoConference'
import SearchPage from './pages/SearchPage'
import CompleteProfile from './pages/CompleteProfile'
import Header from './components/Header'

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id)
})

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error)
})

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason)
})

export const SocketContext = React.createContext(socket)

export default function App(){
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const navigate = useNavigate()

  useEffect(()=>{
    console.log('App mounted, user:', user)
    
    // Check if student needs to complete profile
    if (user && user.role === 'student' && !user.profileCompleted) {
      if (window.location.pathname !== '/complete-profile') {
        navigate('/complete-profile')
      }
    }
    
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
            <Route path='/complete-profile' element={<CompleteProfile setUser={setUser} />} />
            <Route path='/' element={<Dashboard user={user} setUser={setUser} />} />
            <Route path='/dashboard' element={<Dashboard user={user} setUser={setUser} />} />
            <Route path='/notices' element={<Notices />} />
            <Route path='/uploads' element={<Uploads />} />
            <Route path='/subjects' element={<Subjects />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/chat' element={<Chat />} />
            <Route path='/assignments' element={<Assignments />} />
            <Route path='/assignments/:id' element={<AssignmentDetail />} />
            <Route path='/grades' element={<Grades />} />
            <Route path='/attendance' element={<Attendance />} />
            <Route path='/attendance/student-qr' element={<StudentQRGeneration />} />
            <Route path='/calendar' element={<CalendarPage />} />
            <Route path='/analytics' element={<AnalyticsDashboard />} />
            <Route path='/chatrooms' element={<ChatRoomsPage />} />
            <Route path='/video/:roomId' element={<VideoConference />} />
            <Route path='/search' element={<SearchPage />} />
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

