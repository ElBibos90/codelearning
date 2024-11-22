import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const icons = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />
};

const Toast = ({ 
  toast,
  onRemove,
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === Infinity) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onRemove, toast.id]);

  const variants = {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
  };

  const getToastStyles = () => {
    const baseStyles = "pointer-events-auto flex w-full items-center justify-between space-x-4 rtl:space-x-reverse p-4 rounded-lg shadow-lg";
    const variantStyles = {
      success: "bg-green-50 text-green-800 border border-green-200",
      error: "bg-red-50 text-red-800 border border-red-200",
      warning: "bg-yellow-50 text-yellow-800 border border-yellow-200",
      info: "bg-blue-50 text-blue-800 border border-blue-200"
    };

    return `${baseStyles} ${variantStyles[toast.type || 'info']}`;
  };

  return (
    <motion.div
      layout
      initial="initial"
      animate={isVisible ? "animate" : "exit"}
      exit="exit"
      variants={variants}
      className="w-full max-w-md overflow-hidden"
    >
      <div className={getToastStyles()}>
        <div className="flex items-center space-x-2">
          <span className="flex-shrink-0">
            {icons[toast.type || 'info']}
          </span>
          <div className="flex-1 text-sm font-medium">
            {toast.title && (
              <p className="font-semibold">{toast.title}</p>
            )}
            <p>{toast.message}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 200);
          }}
          className="flex-shrink-0 rounded-lg p-1 transition-colors duration-200 hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default function Toaster() {
  return (
    <div className="fixed top-4 right-4 z-50 flex w-full max-w-md flex-col gap-2">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
