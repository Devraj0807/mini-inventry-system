import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm
      ${isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
      {isError
        ? <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
        : <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-500" />}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
