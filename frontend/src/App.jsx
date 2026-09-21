import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { GlacierAgentPage } from './pages/GlacierAgentPage';
import { SensorsPage } from './pages/SensorsPage';
import { ImagesPage } from './pages/ImagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoProvider } from './context/DemoContext';

export function App() {
  return (
    <DemoProvider>
      <div className="flex min-h-screen bg-bgCream text-textDark font-sans selection:bg-lightRed selection:text-accentRed">
        {/* Slim Elegant Sidebar */}
        <Sidebar />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Clean Top Header */}
          <Header />

          {/* Route Content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/agent" element={<GlacierAgentPage />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/images" element={<ImagesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </DemoProvider>
  );
}
export default App;
