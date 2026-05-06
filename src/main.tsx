import React from 'react';
import ReactDOM from 'react-dom/client';
import posthog from 'posthog-js';
import { LandingPage } from '@/landing/LandingPage';
import './styles.css';

posthog.init('phc_CQ9UJEmmzhe586scbjKrxUtRD3yy8obAhiYdtwZZtkFA', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2025-05-24',
  person_profiles: 'identified_only',
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>,
);
