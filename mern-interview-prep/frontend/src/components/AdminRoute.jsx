import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAdmin, booting } = useAuth();
  const location = useLocation();

  if (booting) return null;
  if (!isAdmin) return <Navigate to="/" replace state={{ from: location }} />;

  return children;
}
