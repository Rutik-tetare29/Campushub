import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function Header({ user, onLogout }){
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} component={RouterLink} to='/' style={{ textDecoration: 'none', color: 'inherit' }}>
          Campus Connect
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to='/schedule'>Schedule</Button>
          <Button color="inherit" component={RouterLink} to='/subjects'>Subjects</Button>
          <Button color="inherit" component={RouterLink} to='/notices'>Notices</Button>
          <Button color="inherit" component={RouterLink} to='/uploads'>Resources</Button>
          <Button color="inherit" component={RouterLink} to='/chat'>Chat</Button>
          {user?.role === 'admin' && (
            <Button 
              color="inherit" 
              component={RouterLink} 
              to='/admin'
              sx={{ 
                bgcolor: 'error.main', 
                '&:hover': { bgcolor: 'error.dark' },
                ml: 1
              }}
            >
              Admin Panel
            </Button>
          )}
          {user ? (
            <Button color="inherit" onClick={onLogout}>Logout</Button>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to='/login'>Login</Button>
              <Button color="inherit" component={RouterLink} to='/signup'>Signup</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
