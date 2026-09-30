import React from 'react';

type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  info: 'bg-sky-900/60 text-sky-300 border-sky-700',
  success: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  warning: 'bg-amber-900/60 text-amber-300 border-amber-700',
  danger: 'bg-red-900/60 text-red-300 border-red-700',
  neutral: 'bg-gray-700/60 text-gray-300 border-gray-600',
};

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
