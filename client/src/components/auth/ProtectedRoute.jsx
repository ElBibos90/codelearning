import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, isAdmin = false }) {
  const { user, token } = useSelector(state => state.auth);
  const location = useLocation();

  // Se non c'è né user né token, reindirizza al login
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se la route richiede privilegi admin e l'utente non è admin
  if (isAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}