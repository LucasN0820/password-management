import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { I18nProvider } from './providers/I18nProvider'
import { PasswordProvider } from './providers/PasswordProvider'
import { router } from './routes'

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <PasswordProvider>
        <RouterProvider router={router} />
      </PasswordProvider>
    </I18nProvider>
  </React.StrictMode>
)
