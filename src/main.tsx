import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-myanmar/400.css'
import '@fontsource/noto-sans-myanmar/700.css'
import './styles.css'
import App from './App'

if (navigator.storage?.persist) navigator.storage.persist() // ask the browser not to evict our data

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
