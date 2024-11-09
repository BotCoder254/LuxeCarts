import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { addToFavorites, removeFromFavorites } from '../store/slices/favoriteSlice';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);
  const isFavorite = favorites.some(item => item.id === product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(addToCart(product));
    toast.success('Added to cart!');
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    if (isFavorite) {
      dispatch(removeFromFavorites(product.id));
      toast.success('Removed from favorites');
    } else {
      dispatch(addToFavorites(product));
      toast.success('Added to favorites');
    }
  };

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-w-1 aspect-h-1">
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              {discount}% OFF
            </span>
          )}
          {product.stock <= product.stockThreshold && (
            <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              Low Stock
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
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
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full ${
                  isFavorite 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                } transition-colors`}
              >
                <FiHeart className="w-5 h-5" />
              </button>
              <button
                onClick={handleAddToCart}
                className="p-2 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <FiShoppingCart className="w-5 h-5" />
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
      </Link>
    </motion.div>
  );
};

export default ProductCard; 