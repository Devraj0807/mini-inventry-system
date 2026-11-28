import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '../types';

const EMPTY = { sku: '', name: '', category: 'Electronics', unitPrice: '', initialQuantity: '', minStockLevel: '5' };

const inputBase = "w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white";

// Field defined OUTSIDE to prevent focus loss on re-render
function Field({ label, field, type, placeholder, disabled, value, onChange, error }) {
  const t = type || "text";
  const ph = placeholder || "";
  const dis = disabled || false;
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={t}
        value={value}
        placeholder={ph}
        disabled={dis}
        onChange={e => onChange(field, e.target.value)}
        className={inputBase + " " + (dis ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800/60" : "") + " " + (error ? "border-red-400 bg-red-50 dark:bg-red-950" : "border-gray-300 dark:border-gray-700")}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default function ProductModal({ open, product, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(product);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(product
        ? { sku: product.sku, name: product.name, category: product.category,
            unitPrice: product.unitPrice, initialQuantity: product.quantity, minStockLevel: product.minStockLevel }
        : EMPTY);
    }
  }, [open, product]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.unitPrice === '' || isNaN(form.unitPrice) || Number(form.unitPrice) <= 0) e.unitPrice = 'Enter a price > 0';
    if (form.initialQuantity === '' || isNaN(form.initialQuantity) || Number(form.initialQuantity) < 0) e.initialQuantity = 'Enter a valid quantity';
    if (form.minStockLevel === '' || isNaN(form.minStockLevel) || Number(form.minStockLevel) < 0) e.minStockLevel = 'Enter a valid threshold';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category,
      unitPrice: parseFloat(form.unitPrice),
      initialQuantity: parseInt(form.initialQuantity, 10),
      minStockLevel: parseInt(form.minStockLevel, 10),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU / Item Code *" field="sku" placeholder="e.g. ELEC-101"
              disabled={isEdit} value={form.sku} onChange={set} error={errors.sku} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className={`${inputBase} border-gray-300 dark:border-gray-700`}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Product Name *" field="name" placeholder="e.g. HP 15s i5 Laptop"
          value={form.name} onChange={set} error={errors.name} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Unit Price (Rs.) *" field="unitPrice" type="number" placeholder="0"
              value={form.unitPrice} onChange={set} error={errors.unitPrice} />
            <Field label={isEdit ? "Current Qty" : "Initial Qty *"} field="initialQuantity"
              type="number" placeholder="0" disabled={isEdit}
              value={form.initialQuantity} onChange={set} error={errors.initialQuantity} />
            <Field label="Alert Threshold *" field="minStockLevel" type="number" placeholder="5"
              value={form.minStockLevel} onChange={set} error={errors.minStockLevel} />
          </div>
          {isEdit && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              ⚠️ To adjust quantity, use the <strong>Stock In / Out</strong> button on the product row to maintain a full audit trail.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
              {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
