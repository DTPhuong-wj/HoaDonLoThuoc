import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { LabelColor } from '../../types/pharmacy';

interface LabelColorBadgeProps {
  color: LabelColor;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * Huy hiệu phân loại nhãn lô  :
 * - 'green': Nhãn xanh (Nền xanh lá nhẹ, chữ xanh lá đậm, viền xanh lá)
 * - 'white': Nhãn trắng (Nền trắng, viền xám nhạt sắc nét, chữ xám đen)
 */
export const LabelColorBadge: React.FC<LabelColorBadgeProps> = ({
  color,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (color === 'green') {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 shrink-0" />}
        <span>Nhãn xanh</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-2xs ${sizeClasses[size]}`}
    >
      {showIcon && <Circle size={iconSizes[size]} className="text-slate-400 shrink-0" />}
      <span>Nhãn trắng</span>
    </span>
  );
};

export const InvoiceStatusBadge: React.FC<{ hasInvoice?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({
  hasInvoice,
  size = 'md',
}) => {
  return <LabelColorBadge color={hasInvoice ? 'green' : 'white'} size={size} />;
};

export const ExpiryStatusBadge: React.FC<{ label?: string }> = ({
  label = 'Bình thường',
}) => {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5 text-xs">
      {label}
    </span>
  );
};
