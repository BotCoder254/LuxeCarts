import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiAlertTriangle, FiTruck } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const InventoryAlerts = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    // Query for low stock and out of stock products
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lowStock = [];
      const outOfStock = [];

      snapshot.docs.forEach(doc => {
        const product = { id: doc.id, ...doc.data() };
        if (product.stock === 0) {
          outOfStock.push(product);
        } else if (product.stock <= LOW_STOCK_THRESHOLD) {
          lowStock.push(product);
        }
      });

      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);
    });

    return () => unsubscribe();
  }, []);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center text-green-600">
          <FiPackage className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Inventory Status: Good</h3>
        </div>
        <p className="mt-2 text-gray-600">All products are well-stocked.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Out of Stock Alerts */}
      {outOfStockProducts.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg shadow-lg">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertTriangle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Out of Stock Products ({outOfStockProducts.length})</h3>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {outOfStockProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-white p-4 rounded-md shadow-sm"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Restock
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 p-6 rounded-lg shadow-lg">
          <div className="flex items-center text-amber-600 mb-4">
            <FiTruck className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Low Stock Products ({lowStockProducts.length})</h3>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {lowStockProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-white p-4 rounded-md shadow-sm"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">
                      {product.stock} {product.stock === 1 ? 'unit' : 'units'} remaining
                    </p>
                  </div>
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Update Stock
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InventoryAlerts;
