import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import { ROLES } from '../config/roles';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = useSelector(selectIsAdmin);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute; 