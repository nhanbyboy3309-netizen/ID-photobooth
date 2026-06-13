
import React from 'react';

export const COLORS = [
  { hex: '#3b82f6', label: 'Xanh Dương' },
  { hex: '#ef4444', label: 'Đỏ' },
  { hex: '#10b981', label: 'Xanh Lá' },
  { hex: '#8b5cf6', label: 'Tím' },
  { hex: '#f59e0b', label: 'Vàng Cam' },
  { hex: '#ec4899', label: 'Hồng' },
  { hex: '#0f172a', label: 'Đen' },
];

export const InputGroup = ({ label, icon, children }: { label: string, icon?: React.ReactNode, children?: React.ReactNode }) => (
  <div className="group w-full">
    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em] mb-2">{label}</label>
    <div className="relative w-full">
      {icon && <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-brand-500 transition-colors pointer-events-none z-10 text-lg">{icon}</div>}
      {children}
    </div>
  </div>
);

export const baseInputClass = "w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl p-4 focus:bg-white dark:focus:bg-gray-900 focus:ring-8 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all duration-300 placeholder:text-gray-400 placeholder:font-medium";
export const iconInputClass = `${baseInputClass} pl-12`;
