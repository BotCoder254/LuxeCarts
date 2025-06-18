import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';

const ProductExitIntent = ({ product }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!product) return;
    
    // Check if the popup has been shown for this product in this session
    const popupShown = sessionStorage.getItem(`exitPopup_${product.id}`);
    if (popupShown) {
      setHasShown(true);
      return;
    }

    let timer;
    
    const handleMouseLeave = (e) => {
      // Only trigger when mouse moves to the top of the page (likely exiting)
      if (e.clientY <= 5 && !hasShown) {
        // Add a small delay to make sure it's an actual exit intent
        timer = setTimeout(() => {
          setIsVisible(true);
          setHasShown(true);
          // Store in session storage so it doesn't show again in this session
          sessionStorage.setItem(`exitPopup_${product.id}`, 'true');
        }, 300);
      }
    };

    // Wait a few seconds before enabling the exit intent detection
    const enableTimer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
      clearTimeout(enableTimer);
    };
  }, [hasShown, product]);

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({ 
        ...product,
        quantity: 1,
      }));
      toast.success(`${product.name} added to cart!`);
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!product) return null;

  // Calculate discount percentage if there is one
  const hasDiscount = product.discounts?.sale?.enabled;
  const discountPercentage = hasDiscount && product.discounts.sale.discountType === 'percentage' 
    ? product.discounts.sale.discountValue 
    : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md overflow-hidden"
          >
            <div className="relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-24 h-24 rounded-md overflow-hidden mr-4">
                    <img 
                      src={product.images?.[0] || product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <div className="flex items-baseline mt-1">
                      <span className="text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="ml-2 text-sm text-red-600 font-medium">
                          {discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-b py-4 my-4">
                  <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                    Wait! Don't Miss Out!
                  </h2>
                  
                  <p className="text-center text-gray-600 mb-4">
                    This item is in high demand. Add it to your cart now before it's gone!
                  </p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <FiShoppingCart className="mr-2" /> Add to Cart
                  </button>
                  
                  <button
                    onClick={handleClose}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
                
                {hasDiscount && (
                  <p className="mt-4 text-sm text-center text-green-600">
                    Limited time offer! Save {discountPercentage}% when you buy now.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductExitIntent; 