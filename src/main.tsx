import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './artOverlay.css'
import './rigEditorOverlay'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
