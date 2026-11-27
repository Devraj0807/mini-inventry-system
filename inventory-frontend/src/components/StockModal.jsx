import { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function StockModal({ open, product, onSave, onClose }) {
  const [type, setType] = useState('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setType('IN'); setQuantity(''); setReason(''); setError(''); }
  }, [open, product]);

  if (!open || !product) return null;

  const qty = parseInt(quantity, 10);
  const isValidQty = !isNaN(qty) && qty > 0;
  const resultQty = isValidQty ? (type === 'IN' ? product.quantity + qty : product.quantity - qty) : null;
  const isInsufficient = type === 'OUT' && isValidQty && qty > product.quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidQty) { setError('Enter a valid quantity greater than 0'); return; }
    if (isInsufficient) { setError(`Only ${product.quantity} units available to deduct`); return; }
    onSave({ productId: product.id, type, quantity: qty, reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Adjust Stock</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setType('IN'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                ${type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <ArrowUpCircle className="w-4 h-4" /> Stock In (+)
            </button>
            <button type="button" onClick={() => { setType('OUT'); setError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                ${type === 'OUT' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <ArrowDownCircle className="w-4 h-4" /> Stock Out (-)
            </button>
          </div>

          {/* Current balance display */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900">{product.quantity} <span className="text-sm font-normal text-gray-500">units</span></p>
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
            <input type="number" min="1" value={quantity} placeholder="0"
              onChange={e => { setQuantity(e.target.value); setError(''); }}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition text-center text-lg font-bold
                ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          {/* Live balance preview */}
          {isValidQty && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border
              ${isInsufficient ? 'bg-red-50 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
              <span>Result:</span>
              <span className="font-bold text-base">
                {product.quantity} {type === 'IN' ? '+' : '-'} {qty} = {isInsufficient ? '❌ Insufficient' : `${resultQty} units`}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason / Notes</label>
            <input type="text" value={reason} placeholder="e.g. Supplier PO, Customer Sale, Damaged..."
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isInsufficient}
              className={`flex-1 py-2 text-sm font-medium text-white rounded-lg transition-colors
                ${isInsufficient ? 'bg-gray-400 cursor-not-allowed' : type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Confirm {type === 'IN' ? 'Stock In' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
