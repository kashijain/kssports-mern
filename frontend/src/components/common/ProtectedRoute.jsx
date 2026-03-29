import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useStore';

const ProtectedRoute = ({ sellerOnly = false }) => {
  const location = useLocation();
  const { userInfo, authReady } = useAuthStore();

  if (!authReady) {
    return null;
  }

  if (!userInfo) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (sellerOnly && userInfo.role !== 'seller') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
