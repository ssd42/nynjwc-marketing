import React from 'react';
import ReactDOM from 'react-dom/client';
import { SubmitPage } from './SubmitPage';
import '../styles.css';

// Deliberately no PostHog here — this is a private internal tool, not a
// marketing surface, so it stays out of product analytics.

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root in submit.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <SubmitPage />
  </React.StrictMode>,
);
