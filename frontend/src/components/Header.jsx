import React, { useState, useEffect, useContext } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Menu, MenuItem, Badge, Popover, Card, CardContent } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DashboardIcon from '@mui/icons-material/Dashboard'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BookIcon from '@mui/icons-material/Book'
import CampaignIcon from '@mui/icons-material/Campaign'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ChatIcon from '@mui/icons-material/Chat'
import AssignmentIcon from '@mui/icons-material/Assignment'
import GradeIcon from '@mui/icons-material/Grade'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import GroupsIcon from '@mui/icons-material/Groups'
import VideoCallIcon from '@mui/icons-material/VideoCall'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { SocketContext } from '../App'
import API from '../api'
import { toast } from 'react-toastify'

export default function Header({ user, onLogout }){
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [featuresAnchor, setFeaturesAnchor] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const socket = useContext(SocketContext)

  useEffect(() => {
    if (user) {
      // Fetch initial notifications
      fetchNotifications()

      // Listen for real-time notifications
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show toast notification
        toast.info(`${notification.title}: ${notification.message}`, {
          onClick: () => {
            if (notification.link) {
              window.location.href = notification.link
            }
          }
        })
      })

      return () => {
        socket.off('notification')
      }
    }
  }, [user, socket])

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/schedule', label: 'Schedule', icon: <CalendarMonthIcon /> },
    { path: '/subjects', label: 'Subjects', icon: <BookIcon /> },
    { path: '/notices', label: 'Notices', icon: <CampaignIcon /> },
    { path: '/uploads', label: 'Resources', icon: <CloudUploadIcon /> },
    { path: '/chat', label: 'Chat', icon: <ChatIcon /> },
    { path: '/assignments', label: 'Assignments', icon: <AssignmentIcon /> },
    { path: '/grades', label: 'Grades', icon: <GradeIcon /> },
    { path: '/attendance', label: 'Attendance', icon: <CheckCircleIcon /> },
    { path: '/calendar', label: 'Calendar', icon: <EventIcon /> },
    { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { path: '/chatrooms', label: 'Chat Rooms', icon: <GroupsIcon /> },
    { path: '/search', label: 'Search', icon: <SearchIcon /> },
    { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
  ]

  const advancedFeatures = [
    { path: '/assignments', label: 'Assignments', icon: <AssignmentIcon fontSize="small" /> },
    { path: '/grades', label: 'Grades', icon: <GradeIcon fontSize="small" /> },
    { path: '/attendance', label: 'Attendance', icon: <CheckCircleIcon fontSize="small" /> },
    { path: '/calendar', label: 'Calendar', icon: <EventIcon fontSize="small" /> },
    { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon fontSize="small" /> },
    { path: '/chatrooms', label: 'Chat Rooms', icon: <GroupsIcon fontSize="small" /> },
    { path: '/search', label: 'Advanced Search', icon: <SearchIcon fontSize="small" /> },
  ]

  const handleFeaturesClick = (event) => {
    setFeaturesAnchor(event.currentTarget)
  }

  const handleFeaturesClose = () => {
    setFeaturesAnchor(null)
  }

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2, display: { xs: 'block', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }} component={RouterLink} to='/' style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
            🎓 Campus Connect
          </Typography>
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <Button color="inherit" component={RouterLink} to='/dashboard'>Dashboard</Button>
            <Button color="inherit" component={RouterLink} to='/schedule'>Schedule</Button>
            <Button color="inherit" component={RouterLink} to='/subjects'>Subjects</Button>
            <Button color="inherit" component={RouterLink} to='/notices'>Notices</Button>
            <Button color="inherit" component={RouterLink} to='/chat'>Chat</Button>
            
            <Button 
              color="inherit" 
              onClick={handleFeaturesClick}
              endIcon={<SearchIcon />}
            >
              More Features
            </Button>
            <Menu
              anchorEl={featuresAnchor}
              open={Boolean(featuresAnchor)}
              onClose={handleFeaturesClose}
            >
              {advancedFeatures.map((feature) => (
                <MenuItem 
                  key={feature.path} 
                  component={RouterLink} 
                  to={feature.path}
                  onClick={handleFeaturesClose}
                >
                  <ListItemIcon>{feature.icon}</ListItemIcon>
                  <ListItemText>{feature.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
            
            {/* Notification Bell */}
            <IconButton 
              color="inherit" 
              onClick={handleNotificationClick}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Button color="inherit" component={RouterLink} to='/profile'>Profile</Button>
            
            {user?.role === 'admin' && (
              <Button 
                color="inherit" 
                component={RouterLink} 
                to='/admin'
                startIcon={<AdminPanelSettingsIcon />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  ml: 1,
                  fontWeight: 'bold'
                }}
              >
                Admin
              </Button>
            )}
            
            {user ? (
              <Button color="inherit" onClick={onLogout} sx={{ ml: 1 }}>Logout</Button>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to='/login'>Login</Button>
                <Button color="inherit" component={RouterLink} to='/signup'>Signup</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="h6" fontWeight="bold">
              🎓 Campus Connect
            </Typography>
            <Typography variant="body2">
              {user?.name || 'Guest'}
            </Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.path} component={RouterLink} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            {user?.role === 'admin' && (
              <>
                <Divider />
                <ListItem button component={RouterLink} to='/admin' sx={{ bgcolor: 'error.light' }}>
                  <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                  <ListItemText primary="Admin Panel" />
                </ListItem>
              </>
            )}
          </List>
          <Divider />
          <List>
            {user ? (
              <ListItem button onClick={onLogout}>
                <ListItemText primary="Logout" />
              </ListItem>
            ) : (
              <>
                <ListItem button component={RouterLink} to='/login'>
                  <ListItemText primary="Login" />
                </ListItem>
                <ListItem button component={RouterLink} to='/signup'>
                  <ListItemText primary="Signup" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List>
              {notifications.slice(0, 10).map((notif) => (
                <ListItem 
                  key={notif._id}
                  button
                  component={RouterLink}
                  to={notif.link || '#'}
                  onClick={() => {
                    markAsRead(notif._id)
                    handleNotificationClose()
                  }}
                  sx={{
                    bgcolor: notif.read ? 'transparent' : 'action.hover',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}
                >
                  <ListItemText
                    primary={notif.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  )
}
