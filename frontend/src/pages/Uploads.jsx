import React, { useState, useEffect } from 'react'
import { Paper, Typography, Button, Stack, List, ListItem, ListItemText, ListItemIcon, Chip, Alert, Box, IconButton } from '@mui/material'
import { InsertDriveFile, Download, Person, AccessTime } from '@mui/icons-material'
import API from '../api'

export default function Uploads(){
  const [file, setFile] = useState(null)
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const fetchUploads = async () => {
    try {
      const res = await API.get('/upload')
      setUploads(res.data)
    } catch (err) {
      console.error('Failed to fetch uploads:', err)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (!file) return alert('Select a file')
    
    setLoading(true)
    const fd = new FormData();
    fd.append('file', file)
    
    try{
      const res = await API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('File uploaded successfully!')
      setFile(null)
      // Reset file input
      e.target.reset()
      // Refresh uploads list
      fetchUploads()
    }catch(err){
      alert(err?.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const downloadFile = (url, filename) => {
    const link = document.createElement('a')
    link.href = `http://localhost:5000${url}`
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Paper sx={{ p:4 }}>
      <Typography variant='h5' mb={3}>Resources / Uploads</Typography>
      
      {/* Upload Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: '#f5f5f5' }}>
        <Typography variant='h6' mb={2}>Upload New File</Typography>
        <form onSubmit={submit}>
          <Stack spacing={2}>
            <input 
              type='file' 
              onChange={e=>setFile(e.target.files[0])} 
              style={{ padding: '10px', border: '2px dashed #ccc', borderRadius: '8px' }}
            />
            <Button 
              type='submit' 
              variant='contained' 
              disabled={loading || !file}
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {/* Uploaded Files List */}
      <Typography variant='h6' mb={2}>
        Uploaded Resources ({uploads.length})
      </Typography>

      {uploads.length === 0 ? (
        <Alert severity="info">No files uploaded yet. Upload your first file above!</Alert>
      ) : (
        <List>
          {uploads.map(upload => (
            <ListItem 
              key={upload._id} 
              divider
              sx={{ 
                '&:hover': { bgcolor: '#f5f5f5' },
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" sx={{ fontSize: 40 }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {upload.originalName}
                    </Typography>
                    {upload.size && (
                      <Chip label={formatFileSize(upload.size)} size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Stack spacing={0.5} mt={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" />
                      <Typography variant="body2">
                        Uploaded by: {upload.uploadedBy?.name || 'Unknown'} 
                        ({upload.uploadedBy?.role || 'N/A'})
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        {formatDate(upload.uploadedAt)}
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
              <IconButton 
                color="primary" 
                onClick={() => downloadFile(upload.url, upload.originalName)}
                sx={{ ml: 2 }}
              >
                <Download />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  )
}
