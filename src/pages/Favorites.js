import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromFavorites } from '../store/slices/favoriteSlice';
import { addToCart } from '../store/slices/cartSlice';
import { FiHeart, FiShoppingCart, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Favorites = () => {
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);
  const { user } = useSelector((state) => state.auth);

  const handleRemoveFromFavorites = (productId) => {
    dispatch(removeFromFavorites(productId));
    toast.success('Removed from favorites');
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    toast.success('Added to cart');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FiHeart className="mx-auto text-6xl text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Please login to view your favorites
        </h2>
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Login
        </Link>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FiHeart className="mx-auto text-6xl text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your favorites list is empty
        </h2>
        <p className="text-gray-600 mb-8">
          Start adding products you love to your favorites by clicking the heart icon on any product
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <FiShoppingBag className="mr-2" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Favorites</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {favorites.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link to={`/product/${product.id}`} className="block relative">
                  <img
                    src={product.images?.[0] || product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                  {product.onSale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm">
                      Sale
                    </span>
                  )}
                  {product.stock <= product.stockThreshold && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-sm">
                      Low Stock
                    </span>
                  )}
                </Link>

                <div className="p-4">
                  <Link
                    to={`/product/${product.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600 line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="p-2 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Add to Cart"
                      >
                        <FiShoppingCart className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromFavorites(product.id)}
                        className="p-2 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        title="Remove from Favorites"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {product.features && product.features.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {product.features.slice(0, 2).map((feature, index) => (
                        <p key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {feature}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Favorites; 