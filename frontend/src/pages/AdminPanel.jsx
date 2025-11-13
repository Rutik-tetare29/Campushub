import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import {
  Edit,
  Delete,
  Add,
  Person,
  School,
  EventNote,
  Announcement,
  CloudUpload,
  AdminPanelSettings
} from '@mui/icons-material'
import API from '../api'

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function AdminPanel() {
  const [tabValue, setTabValue] = useState(0)
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>Only administrators can access this panel.</Typography>
        </Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AdminPanelSettings sx={{ fontSize: 40, mr: 2, color: 'error.main' }} />
        <Typography variant="h4" fontWeight="bold">
          Admin Control Panel
        </Typography>
      </Box>

      {/* Stats Overview */}
      <StatsOverview />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable">
          <Tab icon={<Person />} label="Users" />
          <Tab icon={<School />} label="Subjects" />
          <Tab icon={<EventNote />} label="Schedules" />
          <Tab icon={<Announcement />} label="Notices" />
          <Tab icon={<CloudUpload />} label="Uploads" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <UsersManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <SubjectsManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <SchedulesManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <NoticesManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        <UploadsManagement />
      </TabPanel>
    </Paper>
  )
}

// Stats Overview Component
function StatsOverview() {
  const [stats, setStats] = useState({
    users: 0,
    subjects: 0,
    schedules: 0,
    notices: 0,
    uploads: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats.users, color: 'primary', icon: <Person /> },
    { label: 'Subjects', value: stats.subjects, color: 'secondary', icon: <School /> },
    { label: 'Schedules', value: stats.schedules, color: 'info', icon: <EventNote /> },
    { label: 'Notices', value: stats.notices, color: 'warning', icon: <Announcement /> },
    { label: 'Uploads', value: stats.uploads, color: 'success', icon: <CloudUpload /> }
  ]

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card sx={{ bgcolor: `${stat.color}.50` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{ color: `${stat.color}.main`, fontSize: 40 }}>
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

// Users Management Component
function UsersManagement() {
  const [users, setUsers] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student', password: '' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      alert('Failed to fetch users')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await API.delete(`/admin/users/${id}`)
      alert('User deleted successfully')
      fetchUsers()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setFormData({ name: user.name, email: user.email, role: user.role, password: '' })
    setOpenDialog(true)
  }

  const handleAdd = () => {
    setEditUser(null)
    setFormData({ name: '', email: '', role: 'student', password: '' })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editUser) {
        // Update existing user
        const updateData = { name: formData.name, email: formData.email, role: formData.role }
        if (formData.password) updateData.password = formData.password
        await API.put(`/admin/users/${editUser._id}`, updateData)
        alert('User updated successfully')
      } else {
        // Create new user
        if (!formData.password) {
          alert('Password is required for new users')
          return
        }
        await API.post('/admin/users', formData)
        alert('User created successfully')
      }
      setOpenDialog(false)
      fetchUsers()
    } catch (err) {
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">User Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Add User
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'error' : user.role === 'teacher' ? 'primary' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEdit(user)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={editUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Subjects Management Component
function SubjectsManagement() {
  const [subjects, setSubjects] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [formData, setFormData] = useState({ name: '', code: '', credits: '', description: '' })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await API.get('/subjects')
      setSubjects(res.data)
    } catch (err) {
      alert('Failed to fetch subjects')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return
    try {
      await API.delete(`/subjects/${id}`)
      alert('Subject deleted successfully')
      fetchSubjects()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete subject')
    }
  }

  const handleEdit = (subject) => {
    setEditSubject(subject)
    setFormData({ name: subject.name, code: subject.code, credits: subject.credits, description: subject.description })
    setOpenDialog(true)
  }

  const handleAdd = () => {
    setEditSubject(null)
    setFormData({ name: '', code: '', credits: '', description: '' })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editSubject) {
        await API.put(`/subjects/${editSubject._id}`, formData)
        alert('Subject updated successfully')
      } else {
        await API.post('/subjects', formData)
        alert('Subject created successfully')
      }
      setOpenDialog(false)
      fetchSubjects()
    } catch (err) {
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Subjects Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Add Subject
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject._id} hover>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.credits}</TableCell>
                <TableCell>{subject.description?.substring(0, 50)}...</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEdit(subject)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(subject._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Subject Code"
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <TextField
              label="Subject Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Credits"
              type="number"
              fullWidth
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editSubject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Schedules Management Component
function SchedulesManagement() {
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const res = await API.get('/schedules')
      setSchedules(res.data)
    } catch (err) {
      alert('Failed to fetch schedules')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return
    try {
      await API.delete(`/schedules/${id}`)
      alert('Schedule deleted successfully')
      fetchSchedules()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete schedule')
    }
  }

  return (
    <>
      <Typography variant="h6" mb={2}>Schedules Management</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule._id} hover>
                <TableCell>{schedule.dayOfWeek}</TableCell>
                <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                <TableCell>{schedule.subject?.name || 'N/A'}</TableCell>
                <TableCell>{schedule.room}</TableCell>
                <TableCell>{schedule.semester}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(schedule._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// Notices Management Component
function NoticesManagement() {
  const [notices, setNotices] = useState([])

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const res = await API.get('/notices')
      setNotices(res.data)
    } catch (err) {
      alert('Failed to fetch notices')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) return
    try {
      await API.delete(`/notices/${id}`)
      alert('Notice deleted successfully')
      fetchNotices()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete notice')
    }
  }

  return (
    <>
      <Typography variant="h6" mb={2}>Notices Management</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Posted By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.map((notice) => (
              <TableRow key={notice._id} hover>
                <TableCell>{notice.title}</TableCell>
                <TableCell>{notice.content?.substring(0, 50)}...</TableCell>
                <TableCell>{notice.createdBy?.name}</TableCell>
                <TableCell>{new Date(notice.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(notice._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// Uploads Management Component
function UploadsManagement() {
  const [uploads, setUploads] = useState([])

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const res = await API.get('/upload')
      setUploads(res.data)
    } catch (err) {
      alert('Failed to fetch uploads')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    try {
      await API.delete(`/upload/${id}`)
      alert('File deleted successfully')
      fetchUploads()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete file')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <>
      <Typography variant="h6" mb={2}>Uploads Management</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Filename</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload._id} hover>
                <TableCell>{upload.originalName}</TableCell>
                <TableCell>{formatFileSize(upload.size)}</TableCell>
                <TableCell>{upload.uploadedBy?.name}</TableCell>
                <TableCell>{new Date(upload.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => handleDelete(upload._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
