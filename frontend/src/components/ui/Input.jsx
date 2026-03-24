import React from 'react';

export const Input = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <input
        className={`
          px-4 py-3 rounded-xl border border-slate-200 
          bg-white text-slate-700 shadow-sm
          placeholder:text-slate-300
          focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 
          outline-none transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
};