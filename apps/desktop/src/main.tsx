import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { I18nProvider } from './providers/I18nProvider';
import { PasswordProvider } from './providers/PasswordProvider';
import { router } from './routes';

const isSpotlightWindow =
  window.location.hash === '#/search' || window.location.pathname === '/search';

if (isSpotlightWindow) {
  document.documentElement.classList.add('spotlight-window');
  document.body.classList.add('spotlight-window');
}

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <PasswordProvider>
        <RouterProvider router={router} />
      </PasswordProvider>
    </I18nProvider>
  </React.StrictMode>
);
