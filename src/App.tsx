import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { TaskView } from './components/views/TaskView';
import { KaryawanView } from './components/views/KaryawanView';
import { GajiView } from './components/views/GajiView';
import { KasbonView } from './components/views/KasbonView';
import { PengeluaranView } from './components/views/PengeluaranView';
import { TransaksiHarianView } from './components/views/TransaksiHarianView';
import { UserManagementView } from './components/views/UserManagementView';
import { PengaturanView } from './components/views/PengaturanView';

const MainContent: React.FC = () => {
  const { activeTab, isLoading, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 2. Authentication Check (Show Login Page if not logged in)
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const isAdmin = currentUser.role === 'Admin';

  // 3. Render Active View with Role-Based Route Protection
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'task':
        return <TaskView />;
      case 'karyawan':
        return isAdmin ? <KaryawanView /> : <DashboardView />;
      case 'gaji':
        return <GajiView />;
      case 'kasbon':
        return <KasbonView />;
      case 'pengeluaran':
        return <PengeluaranView />;
      case 'transaksi_harian':
        return <TransaksiHarianView />;
      case 'users':
        return isAdmin ? <UserManagementView /> : <DashboardView />;
      case 'pengaturan':
        return isAdmin ? <PengaturanView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {isAdmin && <Sidebar />}
      {isAdmin && (
        <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className={`flex-1 ${isAdmin ? 'p-3 sm:p-6 md:p-8 max-w-7xl' : 'p-3 sm:p-4 max-w-lg'} w-full mx-auto`}>
          {renderActiveView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
