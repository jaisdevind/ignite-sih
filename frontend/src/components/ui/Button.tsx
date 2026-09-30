// src/components/ui/Button.tsx
import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

export default function Button({ variant = 'primary', loading, className = '', children, ...rest }: ButtonProps) {
  const base = 'px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-gray-900 hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-400',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
      disabled={loading}
      {...rest}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}
