
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

export const baseInputClass = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl p-4 shadow-sm focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all duration-300 placeholder:text-gray-400 placeholder:font-medium";
export const iconInputClass = `${baseInputClass} pl-12`;

export const ToggleRow = ({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-700 transition-all text-left"
  >
    {icon && <span className="text-xl shrink-0">{icon}</span>}
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm text-gray-900 dark:text-white">{label}</div>
      {description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>}
    </div>
    <span
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 ${
        checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  </button>
);
