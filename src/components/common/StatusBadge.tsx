import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  hasInvoice: boolean;
  needsReview?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  hasInvoice,
  needsReview = false,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 13,
    md: 14,
    lg: 16,
  };

  if (needsReview) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 ${sizeClasses[size]}`}
      >
        {showIcon && <AlertTriangle size={iconSizes[size]} className="text-rose-600 shrink-0" />}
        <span>Cần kiểm tra</span>
      </span>
    );
  }

  if (hasInvoice) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 text-emerald-800 ${sizeClasses[size]}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes[size]} className="text-emerald-600 shrink-0" />}
        <span>Đã có hóa đơn</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses[size]}`}
    >
      {showIcon && <Clock size={iconSizes[size]} className="text-amber-600 shrink-0" />}
      <span>Chưa có hóa đơn</span>
    </span>
  );
};
