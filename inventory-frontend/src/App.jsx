import { useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, Package, Sun, Moon } from 'lucide-react';
import ProductsPage from './pages/ProductsPage';
import ReportPage from './pages/ReportPage';
import Toast from './components/Toast';
import { fetchLowStock } from './api';

const NAV = [
  { id: 'report',   label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'products', label: 'Products',   Icon: Package },
];

export default function App() {
  const [page, setPage] = useState('report');
  const [toast, setToast] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('inv_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('inv_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const showToast = useCallback((t) => setToast(t), []);
  const refreshAlerts = useCallback(async () => {
    try {
      const items = await fetchLowStock();
      setAlertCount(items.length);
    } catch {
      // ignore initial badge error; page displays full error if offline
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
      {/* Top Nav */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">MiniInventory</span>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {NAV.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setPage(id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${page === id
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === 'report' && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Dark mode toggle */}
            <button onClick={() => setDark(d => !d)}
              className="ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {page === 'report'
          ? <ReportPage onToast={showToast} onRefresh={refreshAlerts} dark={dark} />
          : <ProductsPage onToast={showToast} onRefresh={refreshAlerts} />}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
