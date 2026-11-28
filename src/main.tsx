import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-myanmar/400.css'
import '@fontsource/noto-sans-myanmar/700.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import './styles.css'
import App from './App'

// Offline support with eager updates: check for a new version whenever the app is opened or brought back,
// and switch to it straight away (installed phone apps often resume an old copy otherwise).
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, reg) {
        if (!reg) return
        const check = () => reg.update().catch(() => {})
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
        setInterval(check, 30 * 60 * 1000)
      },
    })
  })
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloaded && navigator.serviceWorker.controller) {
      reloaded = true
      location.reload()
    }
  })
}

if (navigator.storage?.persist) navigator.storage.persist() // ask the browser not to evict our data

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
