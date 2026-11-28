import { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Flame } from 'lucide-react';

const DRAIN_REASONS = [
  "Damaged / Defective",
  "Expired / Shelf Life Over",
  "Stolen / Lost",
  "Quality Rejected",
  "Write-off / Disposal",
];

export default function StockModal({ open, product, onSave, onClose }) {
  const [mode, setMode] = useState('IN');   // 'IN' | 'OUT' | 'DRAIN'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setMode('IN'); setQuantity(''); setReason(''); setError(''); }
  }, [open, product]);

  if (!open || !product) return null;

  // Drain mode always deducts full stock unless user changes qty
  const type = mode === 'IN' ? 'IN' : 'OUT';
  const qty = parseInt(quantity, 10);
  const isValidQty = !isNaN(qty) && qty > 0;
  const resultQty = isValidQty ? (type === 'IN' ? product.quantity + qty : product.quantity - qty) : null;
  const isInsufficient = type === 'OUT' && isValidQty && qty > product.quantity;

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setReason('');
    if (m === 'DRAIN') {
      setQuantity(String(product.quantity));  // pre-fill full stock
    } else {
      setQuantity('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidQty) { setError('Enter a valid quantity greater than 0'); return; }
    if (isInsufficient) { setError('Only ' + product.quantity + ' units available to deduct'); return; }
    if (mode === 'DRAIN' && !reason.trim()) { setError('Please select or enter a drain reason'); return; }
    onSave({ productId: product.id, type, quantity: qty, reason: reason.trim() });
  };

  const btnBase = 'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Adjust Stock</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* 3-tab Toggle */}
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => switchMode('IN')}
              className={btnBase + ' ' + (mode === 'IN'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300')}>
              <ArrowUpCircle className="w-4 h-4" /> Stock In
            </button>
            <button type="button" onClick={() => switchMode('OUT')}
              className={btnBase + ' ' + (mode === 'OUT'
                ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300')}>
              <ArrowDownCircle className="w-4 h-4" /> Stock Out
            </button>
            <button type="button" onClick={() => switchMode('DRAIN')}
              className={btnBase + ' ' + (mode === 'DRAIN'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300')}>
              <Flame className="w-4 h-4" /> Drain
            </button>
          </div>

          {/* Drain reason quick-select (only in DRAIN mode) */}
          {mode === 'DRAIN' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2">
                🔥 Drain Reason *
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DRAIN_REASONS.map(r => (
                  <button key={r} type="button"
                    onClick={() => setReason(r)}
                    className={'text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ' + (reason === r
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500')}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current balance */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{product.quantity} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">units</span></p>
            {mode === 'DRAIN' && product.quantity > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">All {product.quantity} units will be drained</p>
            )}
          </div>

          {/* Quantity input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {mode === 'DRAIN' ? 'Units to Drain *' : 'Quantity *'}
            </label>
            <input type="number" min="1" value={quantity} placeholder="0"
              onChange={e => { setQuantity(e.target.value); setError(''); }}
              className={'w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 transition text-center text-lg font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white ' +
                (mode === 'DRAIN' ? 'focus:ring-orange-400 ' : 'focus:ring-indigo-500 ') +
                (error ? 'border-red-400' : 'border-gray-300 dark:border-gray-700')} />
            {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>

          {/* Live preview */}
          {isValidQty && (
            <div className={'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border ' +
              (isInsufficient
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                : mode === 'DRAIN'
                  ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                  : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300')}>
              <span>Result:</span>
              <span className="font-bold text-base">
                {product.quantity} {type === 'IN' ? '+' : '-'} {qty} = {isInsufficient ? '❌ Insufficient' : resultQty + ' units'}
              </span>
            </div>
          )}

          {/* Reason / notes (always shown; pre-filled for DRAIN) */}
          {mode !== 'DRAIN' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Reason / Notes</label>
              <input type="text" value={reason} placeholder="e.g. Supplier PO, Customer Sale..."
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isInsufficient}
              className={'flex-1 py-2 text-sm font-medium text-white rounded-lg transition-colors ' +
                (isInsufficient ? 'bg-gray-400 cursor-not-allowed'
                  : mode === 'IN' ? 'bg-green-600 hover:bg-green-700'
                  : mode === 'DRAIN' ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700')}>
              {mode === 'IN' ? 'Confirm Stock In' : mode === 'DRAIN' ? '🔥 Confirm Drain' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
