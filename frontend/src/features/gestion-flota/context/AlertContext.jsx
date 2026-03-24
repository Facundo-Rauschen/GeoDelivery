import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type, id: Date.now() });
  }, []);

  const hideAlert = useCallback(() => setAlert(null), []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && <Toast key={alert.id} {...alert} onClose={hideAlert} />}
    </AlertContext.Provider>
  );
};

// Componente Visual Interno
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    warning: <Info className="text-amber-500" size={20} />,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-9999 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-10 duration-300 ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-black tracking-tight uppercase">{message}</p>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export const useAlerts = () => useContext(AlertContext);