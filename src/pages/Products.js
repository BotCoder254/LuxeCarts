import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiFilter, FiGrid, FiList, FiX, FiLoader, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDots } from 'react-loader-spinner';
import toast from 'react-hot-toast';
import { fetchPricingRules } from '../store/slices/pricingSlice';
import '../styles/slider.css';

const Products = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [highRatedProducts, setHighRatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sortBy: '',
    inStock: false,
    onSale: false,
  });

  // Handle URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // Fetch pricing rules
  useEffect(() => {
    dispatch(fetchPricingRules());
  }, [dispatch]);

  // Real-time products listener
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          name: data.name || 'Untitled Product',
          description: data.description || '',
          price: parseFloat(data.price) || 0,
          stock: parseInt(data.stock) || 0,
          stockThreshold: parseInt(data.stockThreshold) || 5,
          image: data.image || data.images?.[0] || '',
          images: data.images || [],
          discount: data.discount ? parseFloat(data.discount) : null,
          rating: parseFloat(data.rating) || 0,
          totalRatings: parseInt(data.totalRatings) || 0,
          createdAt: data.createdAt || new Date(),
          discounts: {
            sale: data.discounts?.sale ? {
              ...data.discounts.sale,
              enabled: Boolean(data.discounts.sale.enabled),
              discountValue: parseFloat(data.discounts.sale.discountValue) || 0,
              discountType: data.discounts.sale.discountType || 'percentage',
              startDate: data.discounts.sale.startDate || null,
              endDate: data.discounts.sale.endDate || null
            } : {
              enabled: false,
              discountValue: 0,
              discountType: 'percentage'
            },
            bulk: data.discounts?.bulk ? {
              ...data.discounts.bulk,
              enabled: Boolean(data.discounts.bulk.enabled),
              discountValue: parseFloat(data.discounts.bulk.discountValue) || 0,
              discountType: data.discounts.bulk.discountType || 'percentage',
              minQuantity: parseInt(data.discounts.bulk.minQuantity) || 1
            } : {
              enabled: false,
              discountValue: 0,
              discountType: 'percentage',
              minQuantity: 1
            }
          },
          features: Array.isArray(data.features) ? data.features : [],
          onSale: Boolean(data.onSale),
          category: data.category || 'Uncategorized'
        };
      });
      
      setProducts(productsData);
      
      // Get new products (last 8 products)
      const sortedByDate = [...productsData].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      setNewProducts(sortedByDate.slice(0, 8));
      
      // Get high-rated products (rating >= 4.0)
      const highRated = productsData
        .filter(product => product.rating >= 4.0 && product.totalRatings > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
      setHighRatedProducts(highRated);
      
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFilteredProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().split(' ');
      filtered = filtered.filter(product => {
        const searchableFields = [
          product.name,
          product.description,
          product.brand,
          product.category,
          ...(product.tags || []),
          ...(product.features || [])
        ].map(field => (field || '').toLowerCase());
        
        return searchTerms.every(term =>
          searchableFields.some(field => field.includes(term))
        );
      });
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stockQuantity > 0);
    }

    // Sale filter
    if (filters.onSale) {
      filtered = filtered.filter(product => product.salePrice || product.bulkDiscount);
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        const finalPrice = product.salePrice || product.price;
        return finalPrice >= min && finalPrice <= max;
      });
    }

    // Sort products
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aPrice = a.salePrice || a.price;
        const bPrice = b.salePrice || b.price;
        
        switch (filters.sortBy) {
          case 'price-asc':
            return aPrice - bPrice;
          case 'price-desc':
            return bPrice - aPrice;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'newest':
            return b.createdAt - a.createdAt;
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Auto-slide functionality
  const [isPaused, setIsPaused] = useState(false);
  
  // Get items per slide based on screen size
  const getItemsPerSlide = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) return 4; // xl
      if (window.innerWidth >= 1024) return 3; // lg
      if (window.innerWidth >= 640) return 2;  // sm
      return 1; // mobile
    }
    return 4;
  };

  const [itemsPerSlide, setItemsPerSlide] = useState(getItemsPerSlide());

  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide());
      setCurrentSlide(0); // Reset to first slide on resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (newProducts.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(newProducts.length / itemsPerSlide));
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [newProducts.length, isPaused, itemsPerSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(newProducts.length / itemsPerSlide));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(newProducts.length / itemsPerSlide)) % Math.ceil(newProducts.length / itemsPerSlide));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ThreeDots color="#4F46E5" height={50} width={50} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-gray-600">
          Discover our collection of high-quality products
        </p>
      </div>

      {/* New Products Slider */}
      {newProducts.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <div className="flex space-x-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div 
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {Array.from({ length: Math.ceil(newProducts.length / itemsPerSlide) }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {newProducts
                      .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                      .map((product) => {
                        // Calculate discounts for slider products (same logic as ProductCard)
                        const calculateSliderDiscounts = () => {
                          const now = new Date();
                          const discounts = product.discounts || {};
                          const activeDiscounts = [];
                          let finalPrice = parseFloat(product.price) || 0;
                          let totalDiscountPercentage = 0;
                          let totalDiscountAmount = 0;

                          // Check sale discount
                          if (discounts.sale?.enabled) {
                            const startDate = discounts.sale.startDate ? new Date(discounts.sale.startDate) : null;
                            const endDate = discounts.sale.endDate ? new Date(discounts.sale.endDate) : null;

                            if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
                              const discountValue = parseFloat(discounts.sale.discountValue) || 0;
                              const discount = discounts.sale.discountType === 'percentage'
                                ? finalPrice * (discountValue / 100)
                                : discountValue;
                              
                              finalPrice = Math.max(0, finalPrice - discount);
                              totalDiscountAmount += discount;
                              totalDiscountPercentage += discountValue;
                              
                              activeDiscounts.push({
                                type: 'sale',
                                value: discountValue,
                                discountType: discounts.sale.discountType,
                                label: discounts.sale.discountType === 'percentage' 
                                  ? `${discountValue}% Sale` 
                                  : `$${discountValue.toFixed(2)} Off`
                              });
                            }
                          }

                          // Check simple discount percentage
                          if (product.discount && !isNaN(parseFloat(product.discount))) {
                            const discountValue = parseFloat(product.discount);
                            const discount = finalPrice * (discountValue / 100);
                            finalPrice = Math.max(0, finalPrice - discount);
                            totalDiscountAmount += discount;
                            totalDiscountPercentage += discountValue;
                            
                            activeDiscounts.push({
                              type: 'sale',
                              value: discountValue,
                              discountType: 'percentage',
                              label: `${discountValue}% OFF`
                            });
                          }

                          return {
                            finalPrice: parseFloat(finalPrice.toFixed(2)),
                            originalPrice: parseFloat(product.price),
                            activeDiscounts,
                            hasDiscount: totalDiscountAmount > 0,
                            totalDiscountPercentage: Math.round(totalDiscountPercentage)
                          };
                        };

                        const { finalPrice, originalPrice, activeDiscounts, hasDiscount, totalDiscountPercentage } = calculateSliderDiscounts();

                        return (
                          <div key={product.id} className="product-card-hover bg-white rounded-lg shadow-md overflow-hidden">
                            <Link to={`/product/${product.id}`} className="block">
                              <div className="relative">
                                <img
                                  src={product.images?.[0] || product.image}
                                  alt={product.name}
                                  className="w-full h-48 object-cover transform hover:scale-105 transition-transform duration-300"
                                />
                                
                                {/* Discount Tags */}
                                {activeDiscounts.length > 0 && (
                                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    {activeDiscounts.map((discount, index) => (
                                      <motion.div
                                        key={`${discount.type}-${index}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-full text-xs shadow-md"
                                      >
                                        <span>{discount.label}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                                
                                {hasDiscount && (
                                  <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium shadow-md">
                                    {totalDiscountPercentage}% OFF
                                  </span>
                                )}
                                
                                <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-md text-sm font-medium shadow-md">
                                  New
                                </div>
                                
                                {product.stock <= product.stockThreshold && (
                                  <div className="absolute bottom-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                                    Low Stock
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
                                  {product.name}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xl font-bold text-gray-900">
                                        ${finalPrice.toFixed(2)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-sm text-gray-500 line-through">
                                          ${originalPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {product.category && (
                                      <span className="text-xs text-gray-400 capitalize">
                                        {product.category}
                                      </span>
                                    )}
                                  </div>
                                  {product.rating > 0 && (
                                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                      <span className="ml-1 text-sm text-gray-600 font-medium">
                                        {product.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Slide indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: Math.ceil(newProducts.length / itemsPerSlide) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and View Options */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded ${view === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded ${view === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
              title="List View"
            >
              <FiList />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiFilter />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price Range</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Prices</option>
                  <option value="0-50">Under $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200-500">$200 - $500</option>
                  <option value="500-1000">$500 - $1000</option>
                  <option value="1000-999999">Over $1000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">In Stock Only</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">On Sale</label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    category: '',
                    priceRange: '',
                    sortBy: '',
                    inStock: false,
                    onSale: false,
                  });
                  setSearchQuery('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <FiX /> Clear all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Products Section */}
        <div className="flex-1">
          {/* Products Grid/List */}
          <div className={`grid gap-6 ${
            view === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                view={view}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No products found matching your criteria
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - High Rated Products */}
        {highRatedProducts.length > 0 && (
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center mb-4">
                <FiStar className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Top Rated Products</h3>
              </div>
              
              <div className="space-y-4">
                {highRatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, index) => (
                            <FiStar
                              key={index}
                              className={`w-3 h-3 ${
                                index < Math.floor(product.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-xs text-gray-500">
                          {product.rating.toFixed(1)} ({product.totalRatings})
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-6">
                <Link
                  to="/top-rated"
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  View All Top Rated
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
