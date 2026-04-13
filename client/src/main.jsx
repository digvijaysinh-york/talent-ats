/**
 * Client entry: React root, router, Ant Design theme from `createAppTheme()`, global + reset CSS.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { createAppTheme } from './theme/index.js';
import 'antd/dist/reset.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={createAppTheme()}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
