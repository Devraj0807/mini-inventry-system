import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '../api';
import { CATEGORIES, getStockStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductsPage({ onToast, onRefresh }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refresh = async () => {
    await loadProducts();
    onRefresh();
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const status = getStockStatus(p);
    const matchStatus = statusFilter === 'All'
      || (statusFilter === 'In Stock' && status === 'IN_STOCK')
      || (statusFilter === 'Low Stock' && status === 'LOW_STOCK')
      || (statusFilter === 'Out of Stock' && status === 'OUT_OF_STOCK');
    return matchSearch && matchCat && matchStatus;
  });

  const handleSaveProduct = async (data) => {
    try {
      if (productModal.product) {
        await updateProduct(productModal.product.id, data);
        onToast({ type: 'success', message: `"${data.name}" updated successfully!` });
      } else {
        await createProduct(data);
        onToast({ type: 'success', message: `"${data.name}" added to inventory!` });
      }
      setProductModal({ open: false, product: null });
      await refresh();
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    }
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

  const handleDelete = async () => {
    try {
      const target = deleteDialog.product;
      await deleteProduct(target.id);
      onToast({ type: 'success', message: `"${target.name}" deleted.` });
      setDeleteDialog({ open: false, product: null });
      await refresh();
    } catch (err) {
      onToast({ type: 'error', message: err.message });
    }
  };

  const selectBase = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{products.length} items in catalog</p>
        </div>
        <button onClick={() => setProductModal({ open: true, product: null })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectBase}>
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectBase}>
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                {['SKU', 'Product Name', 'Category', 'Unit Price', 'Stock', 'Threshold', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">Loading products...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No products found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500 dark:text-gray-400">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">₹{p.unitPrice.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.quantity === 0 ? 'text-red-600 dark:text-red-400' : p.quantity <= p.minStockLevel ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.minStockLevel}</td>
                  <td className="px-4 py-3"><StatusBadge product={p} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setStockModal({ open: true, product: p })}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors whitespace-nowrap">
                        In / Out
                      </button>
                      <button onClick={() => setProductModal({ open: true, product: p })}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, product: p })}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          Showing {filtered.length} of {products.length} products
        </div>
      </div>

      <ProductModal open={productModal.open} product={productModal.product}
        onSave={handleSaveProduct} onClose={() => setProductModal({ open: false, product: null })} />
      <StockModal open={stockModal.open} product={stockModal.product}
        onSave={handleStockSave} onClose={() => setStockModal({ open: false, product: null })} />
      <ConfirmDialog open={deleteDialog.open}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"? This will also remove all associated stock history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, product: null })} />
    </div>
  );
}
