import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PlatformProvider } from './context/PlatformContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <PlatformProvider>
        <AppRoutes />
      </PlatformProvider>
    </BrowserRouter>
  );
}

