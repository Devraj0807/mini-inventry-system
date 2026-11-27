import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Package, DollarSign, AlertTriangle, XCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { fetchReportSummary, fetchLowStock, fetchTransactions, fetchProducts, adjustStock } from '../api';
import { getStockStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import StockModal from '../components/StockModal';

function KpiCard({ icon: Icon, label, value, sub, color, textColor }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${textColor || 'text-gray-900 dark:text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const EMPTY_SUMMARY = {
  totalProducts: 0,
  totalUnitsInStock: 0,
  totalInventoryValuation: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  recentMovementsCountToday: 0,
};

export default function ReportPage({ onToast, onRefresh, dark }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState({ open: false, product: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, lowData, txnData, prodData] = await Promise.all([
        fetchReportSummary(),
        fetchLowStock(),
        fetchTransactions(8),
        fetchProducts(),
      ]);
      setSummary(sumData);
      setLowStockItems(lowData);
      setTransactions(txnData);
      setProducts(prodData);
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = async () => {
    await loadData();
    onRefresh();
  };

  const handleStockSave = async (payload) => {
    try {
      await adjustStock(payload);
      const verb = payload.type === 'IN' ? 'added to' : 'deducted from';
      onToast({ type: 'success', message: `${payload.quantity} units ${verb} stock successfully!` });
      setStockModal({ open: false, product: null });
      await refresh();
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const stockBarData = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6)
    .map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      Stock: p.quantity,
      Threshold: p.minStockLevel,
    }));

  const inStock = products.filter(p => getStockStatus(p) === 'IN_STOCK').length;
  const lowStock = products.filter(p => getStockStatus(p) === 'LOW_STOCK').length;
  const outOfStock = products.filter(p => getStockStatus(p) === 'OUT_OF_STOCK').length;
  const pieData = [
    { name: 'In Stock', value: inStock },
    { name: 'Low Stock', value: lowStock },
    { name: 'Out of Stock', value: outOfStock },
  ].filter(d => d.value > 0);

  const categoryMap = {};
  products.forEach(p => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.quantity * p.unitPrice;
  });
  const categoryData = Object.entries(categoryMap).map(([cat, val]) => ({
    name: cat,
    Value: parseFloat(val.toFixed(2)),
  }));

  const axisStyle = { fill: dark ? '#9ca3af' : '#6b7280', fontSize: 11 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Loading snapshot from SQLite...' : 'Live snapshot of your inventory health'}
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Products" value={summary.totalProducts} sub={`${summary.totalUnitsInStock} total units`} color="bg-indigo-500" />
        <KpiCard icon={DollarSign} label="Inventory Value" value={fmt(summary.totalInventoryValuation)} sub="Cost at current stock" color="bg-emerald-500" />
        <KpiCard icon={AlertTriangle} label="Low Stock" value={summary.lowStockCount} sub="Need restocking soon" color="bg-amber-500" textColor="text-amber-600 dark:text-amber-400" />
        <KpiCard icon={XCircle} label="Out of Stock" value={summary.outOfStockCount} sub="Immediate action needed" color="bg-red-500" textColor="text-red-600 dark:text-red-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Stock Levels vs Alert Threshold</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Top 6 products by current quantity</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockBarData} barGap={4} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }} />
              <Bar dataKey="Stock" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {stockBarData.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.Stock === 0 ? '#ef4444' : entry.Stock <= entry.Threshold ? '#f59e0b' : '#6366f1'} />
                ))}
              </Bar>
              <Bar dataKey="Threshold" fill={dark ? '#374151' : '#e5e7eb'} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Stock Status Distribution</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Products by health status</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={4} stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: dark ? '#9ca3af' : '#6b7280' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Value by Category */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Inventory Value by Category</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Total rupee value (qty × price) per category</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryData} margin={{ top: 4, right: 8, left: 10, bottom: 0 }}>
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Value']} />
            <Bar dataKey="Value" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-300">Low Stock Alert</h2>
              <p className="text-xs text-amber-700 dark:text-amber-400">{lowStockItems.length} items require immediate attention</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Product', 'Category', 'In Stock', 'Threshold', 'Deficit', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lowStockItems.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                    <td className="px-5 py-3 font-bold text-red-600 dark:text-red-400">{p.quantity}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{p.minStockLevel}</td>
                    <td className="px-5 py-3 font-semibold text-amber-700 dark:text-amber-400">+{p.deficit} needed</td>
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

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recent Stock Movements</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Latest inventory adjustments</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet.</p>
          ) : transactions.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <div className={`p-2 rounded-lg shrink-0 ${t.type === 'IN' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                {t.type === 'IN'
                  ? <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  : <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.productName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t.reason || 'No reason provided'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${t.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {t.type === 'IN' ? '+' : '-'}{t.quantity} units
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t.previousQuantity} → {t.newQuantity}</p>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block">
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
