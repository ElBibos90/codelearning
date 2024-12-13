import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext.jsx'; // Aggiungi l'estensione .jsx

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};