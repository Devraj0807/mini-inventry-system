import { getStockStatus } from '../types';

const configs = {
  IN_STOCK:    { label: 'In Stock',     bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  LOW_STOCK:   { label: 'Low Stock',    bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  OUT_OF_STOCK:{ label: 'Out of Stock', bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'   },
};

export default function StatusBadge({ product }) {
  const status = getStockStatus(product);
  const { label, bg, text, dot } = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
