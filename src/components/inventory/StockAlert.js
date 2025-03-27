import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiBell } from 'react-icons/fi';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const StockAlert = ({ stock, productId, lowStockThreshold = 5 }) => {
  const { user } = useSelector((state) => state.auth);

  const handleNotifyMe = async () => {
    if (!user) {
      toast.error('Please login to get stock notifications');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        notifyUsers: [...(notifyUsers || []), user.uid]
      });
      toast.success('You will be notified when this item is back in stock');
    } catch (error) {
      console.error('Error setting notification:', error);
      toast.error('Failed to set notification');
    }
  };

  if (stock === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full p-2 bg-red-50 rounded-lg"
      >
        <div className="flex items-center text-red-600">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Out of Stock</span>
        </div>
        <button
          onClick={handleNotifyMe}
          className="flex items-center px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          <FiBell className="w-4 h-4 mr-1" />
          Notify Me
        </button>
      </motion.div>
    );
  }

  if (stock <= lowStockThreshold) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center text-amber-600 bg-amber-50 p-2 rounded-lg"
      >
        <FiAlertCircle className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">
          Only {stock} {stock === 1 ? 'item' : 'items'} left!
        </span>
      </motion.div>
    );
  }

  return null;
};

export default StockAlert;
