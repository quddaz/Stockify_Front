import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WebSocketProvider from './components/WebSocketProvider';
import MainPage from './pages/MainPage';
import LoginPage from './pages/Login';
import LoginCallback from './pages/LoginCallback';
import CompanyPage from './pages/CompanyPage';

function App() {
  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/login/callback" element={<LoginCallback />} />
          
          <Route path="/company/:companyName" element={<CompanyPage />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
}

export default App;