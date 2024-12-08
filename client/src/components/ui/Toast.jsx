import { useToastStore } from '../../store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const Toast = ({ toast, onRemove }) => {
  const Icon = icons[toast.type] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <Icon 
            className={`w-5 h-5 ${
              toast.type === 'success' ? 'text-green-500' :
              toast.type === 'error' ? 'text-red-500' :
              toast.type === 'warning' ? 'text-yellow-500' :
              'text-blue-500'
            }`}
          />
          <div className="ml-3 w-0 flex-1">
            {toast.title && (
              <p className="font-medium text-gray-900">{toast.title}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
          </div>
        </div>
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="flex shrink-0 p-2 hover:bg-gray-100"
      >
        <X className="w-5 h-5 text-gray-400" />
      </button>
    </motion.div>
  );
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}