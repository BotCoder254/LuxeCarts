import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';

const LiveInventory = ({ productId, initialStock, children }) => {
  const [stock, setStock] = useState(initialStock);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates for this product's stock
    const unsubscribe = onSnapshot(
      doc(db, 'products', productId),
      (doc) => {
        if (doc.exists()) {
          const newStock = doc.data().stock;
          if (newStock !== stock) {
            setIsUpdating(true);
            setStock(newStock);
            setTimeout(() => setIsUpdating(false), 1000);
          }
        }
      },
      (error) => {
        console.error('Error listening to stock updates:', error);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  return (
    <div className="relative">
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1 rounded-full"
          >
            <FiRefreshCw className="w-3 h-3 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      {React.Children.map(children, child =>
        React.cloneElement(child, { stock })
      )}
    </div>
  );
};

export default LiveInventory;
