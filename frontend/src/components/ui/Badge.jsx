import React from 'react';

export const Badge = ({ children, color = 'blue', variant = 'flat' }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    slate: "bg-slate-800 text-slate-400 border-slate-700"
  };

  return (
    <span className={`
      text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-tighter
      ${colors[color]}
    `}>
      {children}
    </span>
  );
};