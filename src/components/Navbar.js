import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser, selectIsAdmin } from '../store/slices/authSlice';
import { FiShoppingBag, FiUser, FiLogOut, FiMenu, FiX, FiShoppingCart, FiHeart, FiSearch, FiGrid } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = useSelector(selectIsAdmin);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { items: favorites } = useSelector((state) => state.favorites);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false); // Close mobile menu after search
    }
  };

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Living',
    'Beauty',
    'Sports',
    'Books',
  ];

  // Don't show navbar on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FiShoppingBag className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">LuxeCart</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <div className="relative group">
                <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Categories
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${category}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                to="/products"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                All Products
              </Link>
              {isAdmin && (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/products"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Products
                      </Link>
                      <Link
                        to="/admin/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Orders
                      </Link>
                      <Link
                        to="/admin/users"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Users
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="p-2 text-gray-700 hover:text-indigo-600 relative"
            >
              <FiShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Favorites Icon */}
            <Link
              to="/favorites"
              className="p-2 text-gray-700 hover:text-indigo-600 relative"
            >
              <FiHeart className="h-6 w-6" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full border-2 border-indigo-600"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      {user.displayName?.charAt(0) || user.email?.charAt(0)}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium">
                    {user.displayName || 'Account'}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>

            {/* Admin links */}
            {user?.isAdmin && (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/admin/orders"
                  className="text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <FiShoppingBag className="mr-1" />
                  Orders
                </Link>
                {/* Other admin links */}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </form>

                <Link
                  to="/products"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  All Products
                </Link>

                {/* Categories Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    Categories
                  </button>
                  <div className="pl-4">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${category}`}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>

                {!user && (
                  <>
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Register
                    </Link>
                  </>
                )}

                {user && (
                  <>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      Favorites
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar; 