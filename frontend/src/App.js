import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ClientsPage from './pages/ClientsPage';
import InvoicePage from './pages/InvoicePage';
import ReportsPage from './pages/ReportsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientsPage />} />
        <Route path="/invoice/:clientId" element={<InvoicePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
