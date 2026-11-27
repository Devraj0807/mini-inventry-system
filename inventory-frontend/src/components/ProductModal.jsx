import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '../types';

const EMPTY = { sku: '', name: '', category: 'Electronics', unitPrice: '', initialQuantity: '', minStockLevel: '5' };

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
    if (form.unitPrice === '' || isNaN(form.unitPrice) || Number(form.unitPrice) < 0) e.unitPrice = 'Enter a valid price';
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

  const Field = ({ label, field, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[field]}
        placeholder={placeholder}
        onChange={e => set(field, e.target.value)}
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition
          ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU / Item Code *" field="sku" placeholder="e.g. ELEC-101" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Product Name *" field="name" placeholder="e.g. Logitech MX Master 3S" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Unit Price ($) *" field="unitPrice" type="number" placeholder="0.00" />
            <Field label={isEdit ? 'Current Qty' : 'Initial Qty *'} field="initialQuantity" type="number" placeholder="0" />
            <Field label="Alert Threshold *" field="minStockLevel" type="number" placeholder="5" />
          </div>
          {isEdit && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ To adjust quantity, use the <strong>Stock In / Out</strong> button on the product row to maintain a full audit trail.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
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
