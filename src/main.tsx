import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrototypeApp } from './features/prototype/PrototypeApp'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(<StrictMode><PrototypeApp /></StrictMode>)
