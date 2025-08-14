import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiShoppingBag, FiUser, FiLogOut, FiMenu, FiX, FiShoppingCart, FiHeart, FiSearch, FiGrid, FiPackage, FiImage, FiUsers, FiSettings, FiBriefcase, FiZap, FiMessageSquare, FiStar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { logout, selectIsAdmin } from '../store/slices/authSlice';
import { clearCart, selectCartItemsCount } from '../store/slices/cartSlice';
import { clearFavorites } from '../store/slices/favoriteSlice';

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
  const cartItemsCount = useSelector(selectCartItemsCount);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
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
      await signOut(auth);
      dispatch(logout());
      dispatch(clearCart());
      dispatch(clearFavorites());
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Preserve existing URL parameters while adding/updating search
      const currentParams = new URLSearchParams(location.search);
      currentParams.set('search', searchQuery.trim());
      
      // Navigate to products page with search query
      navigate({
        pathname: '/products',
        search: currentParams.toString()
      });
      
      // Clear search and close mobile menu
      setSearchQuery('');
      setIsMenuOpen(false);
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

  const adminLinks = [
    {
      path: '/admin',
      icon: <FiGrid className="w-5 h-5 mr-3" />,
      label: 'Dashboard'
    },
    {
      path: '/admin/products',
      icon: <FiShoppingBag className="w-5 h-5 mr-3" />,
      label: 'Products'
    },
    {
      path: '/admin/banners',
      icon: <FiImage className="w-5 h-5 mr-3" />,
      label: 'Banner Manager'
    },
    {
      path: '/admin/orders',
      icon: <FiPackage className="w-5 h-5 mr-3" />,
      label: 'Orders'
    },
    {
      path: '/admin/users',
      icon: <FiUsers className="w-5 h-5 mr-3" />,
      label: 'Users'
    }
  ];

  // Don't show navbar on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
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
                <Link
                  to="/top-rated"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <FiStar className="w-4 h-4 mr-1" />
                  Top Rated
                </Link>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Communities
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        to="/communities"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        Browse Communities
                      </Link>
                      {user && (
                        <Link
                          to="/my-communities"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          My Communities
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Product Ideas
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link
                        to="/product-ideas"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        Browse Ideas
                      </Link>
                      {user && (
                        <Link
                          to="/my-product-ideas"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          My Product Ideas
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  to="/blog"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Blog
                </Link>
                {isAdmin && (
                  <div className="relative group">
                    <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                      Admin
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        {adminLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            {link.icon}
                            {link.label}
                          </Link>
                        ))}
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
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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

                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1"
                    >
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <p className="font-medium">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FiSettings className="mr-2" /> Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FiUser className="mr-2" /> Profile
                        </Link>
                      )}
                      
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FiPackage className="mr-2" /> Orders
                      </Link>
                      
                      <Link
                        to="/my-communities"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FiUsers className="mr-2" /> My Communities
                      </Link>
                      
                      <Link
                        to="/my-product-ideas"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <FiStar className="mr-2" /> My Product Ideas
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FiLogOut className="h-5 w-5 mr-2 text-gray-700" />
                        Sign out
                      </button>
                    </div>
                  )}
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
        </nav>

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
                
                <Link
                  to="/top-rated"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 flex items-center"
                >
                  <FiStar className="w-4 h-4 mr-2" />
                  Top Rated
                </Link>
                
                <Link
                  to="/communities"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  Communities
                </Link>

                {user && (
                  <Link
                    to="/my-communities"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 pl-6"
                  >
                    My Communities
                  </Link>
                )}

                <Link
                  to="/product-ideas"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  Product Ideas
                </Link>

                {user && (
                  <Link
                    to="/my-product-ideas"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 pl-6"
                  >
                    My Product Ideas
                  </Link>
                )}

                <Link
                  to="/blog"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  Blog
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
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="h-5 w-5 mr-2 text-red-600" />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Bottom Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600"
          >
            <FiGrid className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            to="/products"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600"
          >
            <FiShoppingBag className="h-6 w-6" />
            <span className="text-xs mt-1">Products</span>
          </Link>

          <Link
            to="/cart"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 relative"
          >
            <FiShoppingCart className="h-6 w-6" />
            <span className="text-xs mt-1">Cart</span>
            {cartItems.length > 0 && (
              <span className="absolute top-0 right-3 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </Link>

          <Link
            to="/favorites"
            className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 relative"
          >
            <FiHeart className="h-6 w-6" />
            <span className="text-xs mt-1">Favorites</span>
            {favorites.length > 0 && (
              <span className="absolute top-0 right-3 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>

          {user ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600"
            >
              <FiUser className="h-6 w-6" />
              <span className="text-xs mt-1">Profile</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600"
            >
              <FiUser className="h-6 w-6" />
              <span className="text-xs mt-1">Login</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600"
            >
              <FiGrid className="h-6 w-6" />
              <span className="text-xs mt-1">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Add padding to the bottom of the page on mobile to account for the bottom navigation */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default Navbar;