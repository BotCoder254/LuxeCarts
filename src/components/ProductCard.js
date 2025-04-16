import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { addToFavorites, removeFromFavorites } from '../store/slices/favoriteSlice';
import { FiShoppingCart, FiHeart, FiTag, FiClock, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ProductCard = ({ product, view = 'grid' }) => {
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);
  const isFavorite = favorites.some(item => item.id === product.id);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';

  // Calculate active discounts and final price
  const calculateDiscounts = () => {
    const now = new Date();
    const discounts = product.discounts || {};
    const activeDiscounts = [];
    let finalPrice = product.price;

    // Check sale discount
    if (discounts.sale?.enabled) {
      const startDate = discounts.sale.startDate ? new Date(discounts.sale.startDate) : null;
      const endDate = discounts.sale.endDate ? new Date(discounts.sale.endDate) : null;

      if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
        const discount = discounts.sale.discountType === 'percentage'
          ? finalPrice * (parseFloat(discounts.sale.discountValue) / 100)
          : parseFloat(discounts.sale.discountValue);
        finalPrice = Math.max(0, finalPrice - discount);
        activeDiscounts.push({
          type: 'sale',
          value: discounts.sale.discountValue,
          discountType: discounts.sale.discountType
        });
      }
    }

    // Check bulk discount
    if (discounts.bulk?.enabled) {
      activeDiscounts.push({
        type: 'bulk',
        value: discounts.bulk.discountValue,
        discountType: discounts.bulk.discountType,
        minQuantity: discounts.bulk.minQuantity
      });
    }

    // Check location-based pricing
    if (discounts.location?.enabled && discounts.location.regions.length > 0) {
      activeDiscounts.push({
        type: 'location',
        regions: discounts.location.regions,
        adjustmentType: discounts.location.adjustmentType,
        adjustmentValue: discounts.location.adjustmentValue
      });
    }

    return {
      finalPrice: Math.max(0, finalPrice),
      activeDiscounts,
      hasDiscount: finalPrice < product.price
    };
  };

  const { finalPrice, activeDiscounts, hasDiscount } = calculateDiscounts();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isPreview) {
      toast.info('This is a preview. Interactive features are disabled.');
      return;
    }
    dispatch(addToCart({ ...product, finalPrice }));
    toast.success('Added to cart!');
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    if (isPreview) {
      toast.info('This is a preview. Interactive features are disabled.');
      return;
    }
    if (isFavorite) {
      dispatch(removeFromFavorites(product.id));
      toast.success('Removed from favorites');
    } else {
      dispatch(addToFavorites({ ...product, finalPrice }));
      toast.success('Added to favorites');
    }
  };

  const getRuleIcon = (type) => {
    switch (type) {
      case 'bulk':
        return <FiTag className="w-3 h-3" />;
      case 'sale':
        return <FiClock className="w-3 h-3" />;
      case 'location':
        return <FiMapPin className="w-3 h-3" />;
      default:
        return <FiTag className="w-3 h-3" />;
    }
  };

  const getDiscountLabel = (discount) => {
    switch (discount.type) {
      case 'bulk':
        return `${discount.value}${discount.discountType === 'percentage' ? '%' : '$'} off ${discount.minQuantity}+`;
      case 'sale':
        return `${discount.value}${discount.discountType === 'percentage' ? '%' : '$'} off`;
      case 'location':
        return `${discount.regions[0]} pricing`;
      default:
        return '';
    }
  };

  const cardContent = (
    <>
      <div className={`relative ${view === 'grid' ? 'aspect-w-1 aspect-h-1' : 'w-48 h-48'}`}>
        <img
          src={product.images?.[0] || product.image}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
        {activeDiscounts.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {activeDiscounts.map((discount, index) => (
              <motion.div
                key={`${discount.type}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-full text-xs shadow-md"
              >
                {getRuleIcon(discount.type)}
                <span>{getDiscountLabel(discount)}</span>
              </motion.div>
            ))}
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
            {Math.round(((product.price - finalPrice) / product.price) * 100)}% OFF
          </span>
        )}
        {product.stock <= product.stockThreshold && (
          <span className="absolute bottom-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-sm font-medium">
            Low Stock
          </span>
        )}
      </div>

      <div className={`p-4 ${view === 'list' ? 'flex-1' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              ${finalPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.price.toFixed(2)}
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
    </>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${
        view === 'list' ? 'flex' : ''
      }`}
    >
      <Link 
        to={isPreview ? '#' : `/product/${product.id}`} 
        className={`block ${view === 'list' ? 'flex flex-1' : ''}`}
        onClick={(e) => isPreview && e.preventDefault()}
      >
        {cardContent}
      </Link>
    </motion.div>
  );
};

export default ProductCard; 