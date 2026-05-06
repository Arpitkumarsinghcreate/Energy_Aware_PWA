import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AdaptiveProvider } from './context/AdaptiveContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdaptiveProvider>
        <App />
      </AdaptiveProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
