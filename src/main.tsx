import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BatchProvider } from './context/BatchContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BatchProvider>
      <App />
    </BatchProvider>
  </StrictMode>
);
