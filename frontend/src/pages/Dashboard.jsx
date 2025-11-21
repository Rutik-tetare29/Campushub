import React, { useContext, useEffect, useState } from 'react'
import API from '../api'
import { SocketContext } from '../App'
import '../styles/Dashboard.css'

export default function Dashboard({ user, setUser }){
  const socket = useContext(SocketContext)
  const [msgs, setMsgs] = useState([])
  const [profileComplete, setProfileComplete] = useState(true)
  const [stats, setStats] = useState({
    schedules: 0,
    subjects: 0,
    notices: 0,
    uploads: 0
  })

  useEffect(() => {
    checkProfileCompletion()
    fetchRealStats()
  }, [])

  const fetchRealStats = async () => {
    try {
      const [schedulesRes, subjectsRes, noticesRes, uploadsRes] = await Promise.all([
        API.get('/schedules').catch(() => ({ data: [] })),
        API.get('/subjects').catch(() => ({ data: [] })),
        API.get('/notices').catch(() => ({ data: [] })),
        API.get('/upload').catch(() => ({ data: [] }))
      ])
      
      setStats({
        schedules: schedulesRes.data.length,
        subjects: subjectsRes.data.length,
        notices: noticesRes.data.length,
        uploads: uploadsRes.data.length
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const checkProfileCompletion = async () => {
    try {
      const userId = user._id || user.id
      const res = await API.get(`/users/profile/${userId}`)
      const profile = res.data
      // Check if essential fields are filled
      const isComplete = profile.phone && profile.address && (
        profile.role === 'student' ? profile.studentId && profile.department :
        profile.role === 'teacher' ? profile.employeeId && profile.department :
        true // Admin doesn't need extra fields
      )
      setProfileComplete(isComplete)
    } catch (err) {
      console.error('Failed to check profile:', err)
    }
  }

  useEffect(()=>{
    socket.on('new_notice', data => {
      setMsgs(m => [{
        icon: 'bi-megaphone-fill',
        color: 'warning',
        text: `New Notice: ${data.title}`,
        time: new Date().toLocaleTimeString()
      }, ...m])
    })
    socket.on('file_uploaded', d => {
      setMsgs(m => [{
        icon: 'bi-cloud-upload-fill',
        color: 'info',
        text: `File uploaded: ${d.filename} by ${d.uploadedBy}`,
        time: new Date().toLocaleTimeString()
      }, ...m])
    })
    socket.on('schedule_updated', () => {
      setMsgs(m => [{
        icon: 'bi-calendar-check-fill',
        color: 'primary',
        text: `Class schedule updated`,
        time: new Date().toLocaleTimeString()
      }, ...m])
    })
    socket.on('new_message', msg => {
      setMsgs(m => [{
        icon: 'bi-chat-dots-fill',
        color: 'success',
        text: `New message from ${msg.sender?.name}: ${msg.content.substring(0,50)}`,
        time: new Date().toLocaleTimeString()
      }, ...m])
    })
    return ()=>{
      socket.off('new_notice')
      socket.off('file_uploaded')
      socket.off('schedule_updated')
      socket.off('new_message')
    }
  },[socket])

  const quickActions = [
    { icon: 'bi-person-circle', title: 'My Profile', href: '/profile', color: 'secondary', description: 'View and edit your profile' },
    { icon: 'bi-calendar-check-fill', title: 'View Schedule', href: '/schedule', color: 'primary', description: 'Check your class timetable' },
    { icon: 'bi-book-fill', title: 'Subjects', href: '/subjects', color: 'purple', description: 'Browse course materials' },
    { icon: 'bi-megaphone-fill', title: 'Notices', href: '/notices', color: 'warning', description: 'Read announcements' },
    { icon: 'bi-cloud-upload-fill', title: 'Resources', href: '/uploads', color: 'info', description: 'Access study materials' },
    { icon: 'bi-chat-dots-fill', title: 'Chat', href: '/chat', color: 'success', description: 'Connect with others' },
    { icon: 'bi-file-earmark-text-fill', title: 'Assignments', href: '/assignments', color: 'primary', description: 'View and submit assignments' },
    { icon: 'bi-trophy-fill', title: 'Grades', href: '/grades', color: 'warning', description: 'Check your academic performance' },
    { icon: 'bi-check-circle-fill', title: 'Attendance', href: '/attendance', color: 'success', description: 'Track your attendance record' },
    { icon: 'bi-calendar-event-fill', title: 'Calendar', href: '/calendar', color: 'info', description: 'View all events and deadlines' },
    { icon: 'bi-graph-up-arrow', title: 'Analytics', href: '/analytics', color: 'purple', description: 'Detailed performance insights' },
    { icon: 'bi-people-fill', title: 'Chat Rooms', href: '/chatrooms', color: 'success', description: 'Join group discussions' },
    { icon: 'bi-camera-video-fill', title: 'Video Conference', href: '/video/general', color: 'danger', description: 'Start or join video calls' },
    { icon: 'bi-search', title: 'Advanced Search', href: '/search', color: 'dark', description: 'Search across all content' },
  ]

  // Add admin panel for admin users
  if (user?.role === 'admin') {
    quickActions.push({
      icon: 'bi-shield-fill-check',
      title: 'Admin Panel',
      href: '/admin',
      color: 'danger',
      description: 'Manage system and users'
    })
  }

  const statsDisplay = [
    { icon: 'bi-calendar-check', label: 'Total Schedules', value: stats.schedules, color: 'primary' },
    { icon: 'bi-book', label: 'Active Subjects', value: stats.subjects, color: 'purple' },
    { icon: 'bi-megaphone', label: 'Total Notices', value: stats.notices, color: 'warning' },
    { icon: 'bi-cloud-upload', label: 'Resources', value: stats.uploads, color: 'success' },
  ]

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Section */}
      <div className="dashboard-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">
                Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>! 👋
              </h1>
              <p className="lead mb-4">
                <span className={`badge bg-${user?.role === 'admin' ? 'danger' : user?.role === 'teacher' ? 'primary' : 'success'} me-2`}>
                  <i className={`bi ${user?.role === 'admin' ? 'bi-shield-fill-check' : user?.role === 'teacher' ? 'bi-person-video3' : 'bi-person-circle'} me-2`}></i>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                Ready to make today productive?
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="dashboard-date">
                <i className="bi bi-calendar3 me-2"></i>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-4">
        {/* Profile Completion Alert */}
        {!profileComplete && (
          <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-3" style={{ fontSize: '24px' }}></i>
              <div className="flex-grow-1">
                <h5 className="alert-heading mb-1">Complete Your Profile</h5>
                <p className="mb-2">Your profile is incomplete. Please add your details to get the most out of Campus Connect.</p>
                <a href="/profile" className="btn btn-sm btn-warning">
                  <i className="bi bi-person-fill-gear me-1"></i>
                  Complete Profile Now
                </a>
              </div>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className={`stat-card stat-card-${stat.color}`}>
                <div className="stat-icon">
                  <i className={`bi ${stat.icon}`}></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{stat.value}</h3>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white border-0 pt-4 pb-3">
            <h4 className="mb-0">
              <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
              Quick Actions
            </h4>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              {quickActions.map((action, index) => (
                <div key={index} className="col-md-6 col-lg-4">
                  <a href={action.href} className="quick-action-card text-decoration-none">
                    <div className={`quick-action-icon bg-${action.color}`}>
                      <i className={action.icon}></i>
                    </div>
                    <div className="quick-action-content">
                      <h6 className="mb-1">{action.title}</h6>
                      <small className="text-muted">{action.description}</small>
                    </div>
                    <i className="bi bi-arrow-right-circle quick-action-arrow"></i>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Notifications */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 pt-4 pb-3">
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="mb-0">
                <i className="bi bi-bell-fill text-danger me-2 shake"></i>
                Live Notifications
              </h4>
              {msgs.length > 0 && (
                <span className="badge bg-danger rounded-pill pulse">{msgs.length}</span>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            {msgs.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-bell-slash display-4 text-muted mb-3 d-block"></i>
                <p className="text-muted mb-0">No notifications yet</p>
                <small className="text-muted">Activity will appear here in real-time</small>
              </div>
            ) : (
              <div className="notification-list">
                {msgs.slice(0, 10).map((msg, i) => (
                  <div key={i} className="notification-item">
                    <div className={`notification-icon bg-${msg.color}`}>
                      <i className={msg.icon}></i>
                    </div>
                    <div className="notification-content">
                      <p className="mb-1">{msg.text}</p>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {msg.time}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

