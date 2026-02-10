
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Não foi possível encontrar o elemento root.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro fatal na renderização do React:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Erro ao iniciar aplicativo.</div>`;
  }
}
