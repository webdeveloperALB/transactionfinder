import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { TransactionInfoForm } from './components/TransactionInfoForm';
import { SearchingStatus } from './components/SearchingStatus';
import { ResultsPage } from './components/ResultsPage';
import { CodeEntry } from './components/CodeEntry';
import { LanguageSelector } from './components/LanguageSelector';
import { Dashboard } from './components/crm/Dashboard';
import { Customers } from './components/crm/Customers';
import { Transactions } from './components/crm/Transactions';
import { Settings } from './components/crm/Settings';
import { Sidebar } from './components/crm/Sidebar';
import { Login } from './components/crm/Login';
import { useLanguageDetection } from './hooks/useLanguageDetection';
import { useUserState } from './hooks/useUserState';
import { adminAuth } from './lib/auth';

function AppContent() {
  useLanguageDetection();
  useUserState();

  const [isAuthenticated, setIsAuthenticated] = useState(adminAuth.isAuthenticated());
  
  // Check if we're on a CRM route
  const isCrmRoute = window.location.pathname.startsWith('/crm');

  // If we're on a CRM route and not authenticated, show login
  if (isCrmRoute && !isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className={`min-h-screen ${isCrmRoute ? 'bg-gray-50' : 'bg-[#0a0a0a]'} text-white`}>
      <LanguageSelector />
      
      {isCrmRoute ? (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/crm" element={<Dashboard />} />
              <Route path="/crm/customers" element={<Customers />} />
              <Route path="/crm/transactions" element={<Transactions />} />
              <Route path="/crm/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<PersonalInfoForm />} />
          <Route path="/code-entry" element={<CodeEntry />} />
          <Route path="/transaction-info" element={<TransactionInfoForm />} />
          <Route path="/searching" element={<SearchingStatus />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;