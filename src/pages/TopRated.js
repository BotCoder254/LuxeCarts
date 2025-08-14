import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import { FiStar, FiTrendingUp, FiAward, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDots } from 'react-loader-spinner';
import toast from 'react-hot-toast';
import { fetchPricingRules } from '../store/slices/pricingSlice';
import '../styles/slider.css';

const TopRated = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [minRating, setMinRating] = useState(4.0);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch pricing rules
  useEffect(() => {
    dispatch(fetchPricingRules());
  }, [dispatch]);

  // Real-time products listener for top-rated products
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
      
      // Filter and sort top-rated products
      const topRatedProducts = productsData
        .filter(product => product.rating >= minRating && product.totalRatings > 0)
        .sort((a, b) => {
          switch (sortBy) {
            case 'rating':
              return b.rating - a.rating;
            case 'reviews':
              return b.totalRatings - a.totalRatings;
            case 'price-asc':
              return a.price - b.price;
            case 'price-desc':
              return b.price - a.price;
            case 'newest':
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return dateB - dateA;
            default:
              return b.rating - a.rating;
          }
        });
      
      setProducts(topRatedProducts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching top-rated products:', error);
      toast.error('Error loading products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [minRating, sortBy]);

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
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
        <div className="flex items-center mb-4">
          <FiAward className="w-8 h-8 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Top Rated Products</h1>
        </div>
        <p className="text-gray-600">
          Discover our highest-rated products loved by customers
        </p>
        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
            <div className="flex items-center">
              <FiStar className="w-6 h-6 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-xl font-bold text-gray-900">
                  {products.length > 0 
                    ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center">
              <FiTrendingUp className="w-6 h-6 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center">
              <FiAward className="w-6 h-6 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-xl font-bold text-gray-900">
                  {products.reduce((sum, p) => sum + p.totalRatings, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Options */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Min Rating:</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={3.0}>3.0+</option>
              <option value={3.5}>3.5+</option>
              <option value={4.0}>4.0+</option>
              <option value={4.5}>4.5+</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="rating">Highest Rating</option>
              <option value="reviews">Most Reviews</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

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
      </div>

      {/* Products Grid/List */}
      <div className={`grid gap-6 ${
        view === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Ranking Badge for top 3 */}
            {index < 3 && view === 'grid' && (
              <div className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
              }`}>
                {index + 1}
              </div>
            )}
            <ProductCard product={product} view={view} />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            No products found with rating {minRating}+ stars
          </p>
          <p className="text-gray-400 text-sm">
            Try lowering the minimum rating filter
          </p>
          <Link
            to="/products"
            className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopRated;