import React, { useContext, useEffect, useState } from 'react'
import API from '../api'
import { SocketContext } from '../App'
import '../styles/Dashboard.css'

export default function Dashboard({ user, setUser }){
  const socket = useContext(SocketContext)
  const [msgs, setMsgs] = useState([])

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
    { icon: 'bi-calendar-check-fill', title: 'View Schedule', href: '/schedule', color: 'primary', description: 'Check your class timetable' },
    { icon: 'bi-book-fill', title: 'Subjects', href: '/subjects', color: 'purple', description: 'Browse course materials' },
    { icon: 'bi-megaphone-fill', title: 'Notices', href: '/notices', color: 'warning', description: 'Read announcements' },
    { icon: 'bi-cloud-upload-fill', title: 'Resources', href: '/uploads', color: 'info', description: 'Access study materials' },
    { icon: 'bi-chat-dots-fill', title: 'Chat', href: '/chat', color: 'success', description: 'Connect with others' },
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

  const stats = [
    { icon: 'bi-calendar-check', label: 'Classes Today', value: '5', color: 'primary' },
    { icon: 'bi-book', label: 'Active Subjects', value: '8', color: 'purple' },
    { icon: 'bi-megaphone', label: 'New Notices', value: '3', color: 'warning' },
    { icon: 'bi-chat-dots', label: 'Messages', value: '12', color: 'success' },
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
        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className={`stat-card stat-card-${stat.color}`}>
                <div className="stat-icon">
                  <i className={stat.icon}></i>
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

