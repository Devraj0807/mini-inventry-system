import { useState, useCallback } from 'react';
import { LayoutDashboard, Package } from 'lucide-react';
import ProductsPage from './pages/ProductsPage';
import ReportPage from './pages/ReportPage';
import Toast from './components/Toast';
import { getReportSummary } from './store';

const NAV = [
  { id: 'report',   label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'products', label: 'Products',   Icon: Package },
];

export default function App() {
  const [page, setPage] = useState('report');
  const [toast, setToast] = useState(null);
  const [alertCount, setAlertCount] = useState(() => getReportSummary().lowStockCount);

  const showToast = useCallback((t) => setToast(t), []);
  const refreshAlerts = useCallback(() => setAlertCount(getReportSummary().lowStockCount), []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">MiniInventory</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setPage(id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${page === id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {page === 'report'
          ? <ReportPage onToast={showToast} onRefresh={refreshAlerts} />
          : <ProductsPage onToast={showToast} onRefresh={refreshAlerts} />}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
