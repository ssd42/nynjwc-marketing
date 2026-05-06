import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from '@/landing/LandingPage';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>,
);
