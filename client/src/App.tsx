import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import TabNav from '@components/TabNav';
import DashboardPage from '@pages/Dashboard';
import SpoolsPage from '@pages/Spools';
import SpoolDetailPage from '@pages/SpoolDetail';
import PrintHistoryPage from '@pages/PrintHistory';
import PrintersPage from '@pages/Printers';
import SettingsPage from '@pages/Settings';
import './App.css';

const TABS = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
  { id: 'spools', path: '/spools', label: 'Spools' },
  { id: 'printers', path: '/printers', label: 'Printers' },
  { id: 'history', path: '/history', label: 'Print History' },
  { id: 'settings', path: '/settings', label: 'Settings' },
];

function getActiveTab(pathname: string): string {
  for (const tab of TABS) {
    if (pathname === tab.path || pathname.startsWith(tab.path + '/')) return tab.id;
  }
  return 'dashboard';
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || '/dashboard';
  const activeTab = getActiveTab(pathname);
  const version = __ADDON_VERSION__;

  const handleTabChange = (tabId: string) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (tab) navigate(tab.path);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">HA Filament SpoolTracker</h1>
          <div className="header-right">
            {version && <div className="version-badge">v{version}</div>}
          </div>
        </div>
      </header>

      <main className="app-main">
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/spools" element={<SpoolsPage />} />
          <Route path="/spools/:id" element={<SpoolDetailPage />} />
          <Route path="/printers" element={<PrintersPage />} />
          <Route path="/history" element={<PrintHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>HA Filament SpoolTracker</p>
      </footer>
    </div>
  );
}

export default App;
