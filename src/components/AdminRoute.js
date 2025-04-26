import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminLayout from './AdminLayout';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = useSelector(selectIsAdmin);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default AdminRoute; 