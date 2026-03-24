import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};