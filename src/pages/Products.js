import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiFilter, FiGrid, FiList, FiX, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDots } from 'react-loader-spinner';
import toast from 'react-hot-toast';
import { fetchPricingRules } from '../store/slices/pricingSlice';

const Products = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

      {/* Products Grid/List */}
      <div className={`grid gap-6 ${
        view === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
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
  );
};

export default Products;
