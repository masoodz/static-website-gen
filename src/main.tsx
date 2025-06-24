import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

const theme = createTheme(); // You can customize this later

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets browser styles */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
