import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { DashboardView } from './components/views/DashboardView';
import { KaryawanView } from './components/views/KaryawanView';
import { GajiView } from './components/views/GajiView';
import { KasbonView } from './components/views/KasbonView';
import { PengeluaranView } from './components/views/PengeluaranView';
import { PengaturanView } from './components/views/PengaturanView';

const MainContent: React.FC = () => {
  const { activeTab, isLoading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardView />;
      case 'karyawan':     return <KaryawanView />;
      case 'gaji':         return <GajiView />;
      case 'kasbon':       return <KasbonView />;
      case 'pengeluaran':  return <PengeluaranView />;
      case 'pengaturan':   return <PengaturanView />;
      default:             return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
