import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBox, FiShoppingBag, FiUsers, FiMenu, FiX, FiSettings, FiLogOut, FiUser, FiPackage, FiShield, FiTag, FiImage, FiFileText, FiPercent, FiClock, FiMapPin, FiTruck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const menuItems = [
    { path: '/admin', icon: <FiHome className="w-6 h-6" />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FiBox className="w-6 h-6" />, label: 'Products' },
    { path: '/admin/orders', icon: <FiShoppingBag className="w-6 h-6" />, label: 'Orders' },
    { path: '/admin/users', icon: <FiUsers className="w-6 h-6" />, label: 'Users' },
    { path: '/admin/inventory', icon: <FiPackage className="w-6 h-6" />, label: 'Inventory' },
    { path: '/admin/banners', icon: <FiImage className="w-6 h-6" />, label: 'Banner Manager' },
    { path: '/admin/flash-sales', icon: <FiClock className="w-6 h-6" />, label: 'Flash Sales' },
    { path: '/admin/blogs', icon: <FiFileText className="w-6 h-6" />, label: 'Blog Posts' },
    { path: '/admin/promotions', icon: <FiPercent className="w-6 h-6" />, label: 'Promotions' },
    { path: '/admin/pickup-locations', icon: <FiMapPin className="w-6 h-6" />, label: 'Pickup Locations' },
    { path: '/admin/insurance', icon: <FiShield className="w-6 h-6" />, label: 'Insurance Plans' },
    { path: '/admin/security', icon: <FiShield className="w-6 h-6" />, label: 'Security' },
    { path: '/admin/pricing', icon: <FiTag className="w-6 h-6" />, label: 'Pricing Rules' },
    { path: '/admin/profile', icon: <FiUser className="w-6 h-6" />, label: 'Profile' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location, isMobile]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-md fixed top-0 left-0 right-0 z-20 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-64 transform ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'fixed inset-y-0 left-0 w-64'
        } bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                  location.pathname === item.path
                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                    : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <Link
              to="/"
              className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 mb-4"
            >
              <FiShoppingBag className="mr-2" />
              View Store
            </Link>
            <button
              onClick={() => {
                dispatch(logoutUser());
                navigate('/login');
              }}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <FiLogOut className="mr-3 w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? 'pt-16' : 'pt-8'
        } lg:ml-64 min-h-screen`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;