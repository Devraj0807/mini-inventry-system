import { useState } from 'react';
import { Package, DollarSign, AlertTriangle, XCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { getReportSummary, getTransactions, adjustStock } from '../store';
import StatusBadge from '../components/StatusBadge';
import StockModal from '../components/StockModal';

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm flex items-start gap-4 border-gray-200`}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportPage({ onToast, onRefresh }) {
  const [summary, setSummary] = useState(getReportSummary);
  const [transactions] = useState(() => getTransactions().slice(0, 8));
  const [stockModal, setStockModal] = useState({ open: false, product: null });

  const refresh = () => {
    setSummary(getReportSummary());
    onRefresh();
  };

  const handleStockSave = (payload) => {
    try {
      adjustStock(payload);
      const verb = payload.type === 'IN' ? 'added to' : 'deducted from';
      onToast({ type: 'success', message: `${payload.quantity} units ${verb} stock successfully!` });
      setStockModal({ open: false, product: null });
      refresh();
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory Report</h1>
          <p className="text-sm text-gray-500">Live snapshot of your inventory health</p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Products" value={summary.totalProducts} sub={`${summary.totalUnitsInStock} total units`} color="bg-indigo-500" />
        <KpiCard icon={DollarSign} label="Inventory Value" value={fmt(summary.totalInventoryValuation)} sub="Cost at current stock" color="bg-emerald-500" />
        <KpiCard icon={AlertTriangle} label="Low Stock Alert" value={summary.lowStockCount} sub="Need restocking soon" color="bg-amber-500" />
        <KpiCard icon={XCircle} label="Out of Stock" value={summary.outOfStockCount} sub="Immediate action needed" color="bg-red-500" />
      </div>

      {/* Low Stock Alert Banner */}
      {summary.lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-b border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">Low Stock Alert</h2>
              <p className="text-xs text-amber-700">{summary.lowStockItems.length} items require immediate attention</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">In Stock</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Threshold</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Deficit</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.lowStockItems.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.category}</td>
                    <td className="px-5 py-3 font-bold text-red-600">{p.quantity}</td>
                    <td className="px-5 py-3 text-gray-500">{p.minStockLevel}</td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-amber-700">+{p.deficit} needed</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge product={p} /></td>
                    <td className="px-5 py-3">
                      <button onClick={() => setStockModal({ open: true, product: p })}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                        + Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Recent Stock Movements</h2>
          <p className="text-xs text-gray-500">Latest inventory adjustments</p>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet.</p>
          ) : transactions.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className={`p-2 rounded-lg shrink-0 ${t.type === 'IN' ? 'bg-green-50' : 'bg-red-50'}`}>
                {t.type === 'IN'
                  ? <TrendingUp className="w-4 h-4 text-green-600" />
                  : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.productName}</p>
                <p className="text-xs text-gray-400 truncate">{t.reason || 'No reason provided'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity} units
                </p>
                <p className="text-xs text-gray-400">{t.previousQuantity} → {t.newQuantity}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                {new Date(t.timestamp).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <StockModal open={stockModal.open} product={stockModal.product}
        onSave={handleStockSave} onClose={() => setStockModal({ open: false, product: null })} />
    </div>
  );
}
