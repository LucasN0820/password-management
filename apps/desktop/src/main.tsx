import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { PasswordProvider } from './providers/PasswordProvider'
import { router } from './routes'

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <PasswordProvider>
      <RouterProvider router={router} />
    </PasswordProvider>
  </React.StrictMode>
)
