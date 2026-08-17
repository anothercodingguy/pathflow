'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within an AnimatedToastProvider');
  }
  return context;
}

export function AnimatedToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, type, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 4));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const getIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
    }
  };

  const getBorder = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'warning':
        return 'border-amber-500/30';
      default:
        return 'border-blue-500/30';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              style={{
                zIndex: 100 - index,
              }}
              className={`pointer-events-auto rounded-2xl bg-[#111115]/95 backdrop-blur-md border ${getBorder(
                item.type
              )} p-3.5 shadow-2xl flex items-start gap-3`}
            >
              {getIcon(item.type)}
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-xs font-semibold text-zinc-100">{item.title}</p>
                {item.description && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed truncate">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(item.id)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
