import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './assets/modernEffects.css'
import { ErrorProvider } from './context/ErrorContext'
import { UserRoleProvider } from './context/UserRoleContext'
import { UserNotificationsProvider } from './context/UserNotificationsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorProvider>
        <UserRoleProvider>
          <UserNotificationsProvider>
            <App />
          </UserNotificationsProvider>
        </UserRoleProvider>
      </ErrorProvider>
    </BrowserRouter>
  </React.StrictMode>
)
