import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Dashboard from '@/pages/Dashboard';
import QualityAnalysis from '@/pages/QualityAnalysis';
import DriftDetection from '@/pages/DriftDetection';
import Reports from '@/pages/Reports';
import Layout from '@/components/Layout';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="quality" element={<QualityAnalysis />} />
            <Route path="drift" element={<DriftDetection />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;