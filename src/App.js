import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { selectIsAdmin, setUser } from './store/slices/authSlice';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/config';
import { refreshProducts, updateProductStock } from './store/slices/productSlice';
import { setupInteractionTracking } from './utils/trackInteraction';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminNewProduct from './pages/admin/NewProduct';
import EditProduct from './pages/admin/EditProduct';
import AdminLayout from './components/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './pages/ForgotPassword';
import ErrorBoundary from './components/ErrorBoundary';
import Favorites from './pages/Favorites';
import UserProfile from './pages/UserProfile';
import AdminOrderDetails from './pages/AdminOrderDetails';
import UserAnalytics from './pages/UserAnalytics';
import InventoryAlerts from './components/admin/InventoryAlerts';

function App() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = useSelector(selectIsAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          dispatch(setUser({ uid: firebaseUser.uid, ...userDoc.data() }));
        }
      } else {
        dispatch(setUser(null));
      }
    });

    return () => unsubscribeAuth(); // Cleanup subscription
  }, [dispatch]);

  useEffect(() => {
    // Redirect authenticated users from public routes
    if (user) {
      const publicRoutes = ['/', '/login', '/register', '/forgot-password'];
      if (publicRoutes.includes(location.pathname)) {
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/products');
        }
      }
    }
  }, [user, isAdmin, navigate, location]);

  useEffect(() => {
    // Set up interaction tracking
    let cleanup;
    if (user?.uid) {
      cleanup = setupInteractionTracking(user.uid);
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [user]);

  useEffect(() => {
    // Set up real-time listener for product changes
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const product = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === "modified") {
          // Update product stock in real-time
          dispatch(updateProductStock({ 
            productId: product.id, 
            stock: product.stock 
          }));
        } else if (change.type === "added" || change.type === "removed") {
          // Refresh all products
          dispatch(refreshProducts());
        }
      });
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              user ? (
                <Navigate to={isAdmin ? "/admin" : "/products"} replace />
              ) : (
                <Home />
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={isAdmin ? "/admin" : "/products"} replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? (
                <Navigate to={isAdmin ? "/admin" : "/products"} replace />
              ) : (
                <Register />
              )
            } 
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* User Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <PrivateRoute>
                <OrderDetail />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminNewProduct />} />
                    <Route path="products/edit/:id" element={<EditProduct />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:orderId" element={<AdminOrderDetails />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="profile" element={<UserProfile isAdmin={true} />} />
                    <Route path="inventory" element={<InventoryAlerts />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* User Profile and Analytics Routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <UserAnalytics />
              </PrivateRoute>
            }
          />

          {/* Favorites Route */}
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <Favorites />
              </PrivateRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
