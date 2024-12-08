import { createContext, useContext, useReducer, useCallback } from 'react';

// Esportiamo il context
export const ToastContext = createContext({
  toasts: [],
  addToast: () => null,
  removeToast: () => null
});

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { id: Date.now(), ...action.payload }];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
    default:
      return state;
  }
};

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((toast) => {
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        type: 'info',
        duration: 5000,
        ...toast
      }
    });
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};