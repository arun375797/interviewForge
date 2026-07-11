import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { warmApi } from './api.js'
import { applyTheme, getStoredTheme } from './utils/themeConstants.js'

applyTheme(getStoredTheme())

// Overlap API cold-start with React boot
warmApi()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
