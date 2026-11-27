import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, adjustStock } from '../store';
import { CATEGORIES, getStockStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductsPage({ onToast, onRefresh }) {
  const [products, setProducts] = useState(getProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  const refresh = () => {
    setProducts(getProducts());
    onRefresh();
  };

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const status = getStockStatus(p);
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'In Stock' && status === 'IN_STOCK') ||
      (statusFilter === 'Low Stock' && status === 'LOW_STOCK') ||
      (statusFilter === 'Out of Stock' && status === 'OUT_OF_STOCK');
    return matchSearch && matchCat && matchStatus;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveProduct = (data) => {
    if (productModal.product) {
      updateProduct(productModal.product.id, data);
      onToast({ type: 'success', message: `"${data.name}" updated successfully!` });
    } else {
      const existing = getProducts().find(p => p.sku === data.sku.toUpperCase());
      if (existing) { onToast({ type: 'error', message: `SKU "${data.sku}" already exists.` }); return; }
      addProduct(data);
      onToast({ type: 'success', message: `"${data.name}" added to inventory!` });
    }
    setProductModal({ open: false, product: null });
    refresh();
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

  const handleDelete = () => {
    deleteProduct(deleteDialog.product.id);
    onToast({ type: 'success', message: `"${deleteDialog.product.name}" deleted.` });
    setDeleteDialog({ open: false, product: null });
    refresh();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} items in catalog</p>
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
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SKU', 'Product Name', 'Category', 'Unit Price', 'Stock', 'Threshold', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No products found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">${p.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${p.quantity === 0 ? 'text-red-600' : p.quantity <= p.minStockLevel ? 'text-amber-600' : 'text-gray-900'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.minStockLevel}</td>
                  <td className="px-4 py-3"><StatusBadge product={p} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setStockModal({ open: true, product: p })}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                        In / Out
                      </button>
                      <button onClick={() => setProductModal({ open: true, product: p })}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, product: p })}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {products.length} products
        </div>
      </div>

      {/* Modals */}
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
