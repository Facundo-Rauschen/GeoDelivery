import React from 'react';
import { X } from 'lucide-react';
import { Card } from '../../../components/ui'; 

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200 shadow-2xl border-0 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 bg-white">{children}</div>
      </Card>
    </div>
  );
};
export default Modal;