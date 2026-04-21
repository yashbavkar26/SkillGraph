import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/recruiter-search.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Recruiter UI root element was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
