// src/components/ui/Card.tsx
import React from 'react';

export type CardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-3">{description}</p>}
      {children}
    </div>
  );
}
