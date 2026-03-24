import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 icon-emerald-500",
    error: "bg-red-50 border-red-200 text-red-800 icon-red-500",
    warning: "bg-amber-50 border-amber-200 text-amber-800 icon-amber-500",
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <Info className="text-amber-500" size={20} />,
  };

  return (
    <div className={`fixed bottom-5 right-5 z-100 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in slide-in-from-right-10 duration-300 ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-bold tracking-tight">{message}</p>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;