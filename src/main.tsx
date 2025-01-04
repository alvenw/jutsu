import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import JutsuDashboard from './components/jutsu-dashboard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JutsuDashboard />
  </StrictMode>,
)