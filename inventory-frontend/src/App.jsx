import { useState, useCallback, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, Sun, Moon, Bell, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import ProductsPage from './pages/ProductsPage';
import ReportPage from './pages/ReportPage';
import Toast from './components/Toast';
import { fetchLowStock } from './api';

const NAV = [
  { id: 'report',   label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'products', label: 'Products',   Icon: Package },
];

/* ── Notification Bell Dropdown ─────────────────────────── */
function NotificationBell({ items, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = items.length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="Stock Alerts"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-900 dark:text-amber-300">Stock Alerts</span>
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
              {count} item{count !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Items list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All stocked up!</p>
                <p className="text-xs text-gray-400 mt-0.5">No low-stock alerts right now.</p>
              </div>
            ) : items.map(p => {
              const isOut = p.quantity === 0;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Icon */}
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isOut ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    {isOut
                      ? <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      : <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{p.sku}</p>
                  </div>
                  {/* Badge */}
                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isOut ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                      {isOut ? 'Out' : `${p.quantity} left`}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">min {p.minStockLevel}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer CTA */}
          {count > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => { onNavigate('report'); setOpen(false); }}
                className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-center transition-colors"
              >
                View full alert table on Dashboard →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('report');
  const [toast, setToast] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
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
      setLowStockItems(items);
    } catch {
      // ignore badge errors when offline
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    // Poll every 60 seconds to keep badge fresh
    const id = setInterval(refreshAlerts, 60_000);
    return () => clearInterval(id);
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

          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-1">
              {NAV.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setPage(id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${page === id
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Notification Bell */}
            <NotificationBell items={lowStockItems} onNavigate={setPage} />

            {/* Dark mode toggle */}
            <button onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
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
