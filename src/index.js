import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CssBaseline />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
