import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CollectionProvider } from './CollectionContext';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('The application root was not found.');
createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CollectionProvider><App /></CollectionProvider>
    </BrowserRouter>
  </StrictMode>,
);
