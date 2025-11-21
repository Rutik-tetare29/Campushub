import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import CssBaseline from '@mui/material/CssBaseline'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'

console.log('Main.jsx loaded')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
  console.log('App rendered')
} else {
  console.error('Root element not found!')
}
