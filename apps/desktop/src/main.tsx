import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { PasswordProvider } from './providers/PasswordProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PasswordProvider>
      <RouterProvider router={router} />
    </PasswordProvider>
  </React.StrictMode>
)
