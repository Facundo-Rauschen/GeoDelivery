import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white",
    outline: "bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-4 text-xs uppercase tracking-widest rounded-2xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};