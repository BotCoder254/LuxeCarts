import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiAlertTriangle, FiTruck, FiPieChart, FiBarChart2, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const InventoryAlerts = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [inventoryStats, setInventoryStats] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [stockTrends, setStockTrends] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const allProducts = [];
      const categoryMap = {};
      
      snapshot.docs.forEach(doc => {
        const product = { id: doc.id, ...doc.data() };
        allProducts.push(product);
        
        // Track stock levels
        if (product.stock === 0) {
          outOfStock.push(product);
        } else if (product.stock <= LOW_STOCK_THRESHOLD) {
          lowStock.push(product);
        }
        
        // Track category distribution
        const category = product.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            name: category,
            count: 0,
            lowStock: 0,
            outOfStock: 0,
            value: 0 // For pie chart
          };
        }
        
        categoryMap[category].count++;
        categoryMap[category].value++;
        
        if (product.stock === 0) {
          categoryMap[category].outOfStock++;
        } else if (product.stock <= LOW_STOCK_THRESHOLD) {
          categoryMap[category].lowStock++;
        }
      });
      
      // Prepare inventory stats
      const wellStocked = allProducts.length - lowStock.length - outOfStock.length;
      const inventoryStatsData = [
        { name: 'Well Stocked', value: wellStocked, color: '#10B981' },
        { name: 'Low Stock', value: lowStock.length, color: '#F59E0B' },
        { name: 'Out of Stock', value: outOfStock.length, color: '#EF4444' }
      ];
      
      // Prepare category distribution data
      const categoryData = Object.values(categoryMap);
      
      // Prepare stock trend data (simplified example)
      const stockTrendData = Object.values(categoryMap).map(cat => ({
        name: cat.name,
        inStock: cat.count - cat.lowStock - cat.outOfStock,
        lowStock: cat.lowStock,
        outOfStock: cat.outOfStock
      }));

      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);
      setInventoryStats(inventoryStatsData);
      setCategoryDistribution(categoryData);
      setStockTrends(stockTrendData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg w-full flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg w-full">
        <div className="flex items-center text-green-600">
          <FiPackage className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Inventory Status: Good</h3>
        </div>
        <p className="mt-2 text-gray-600">All products are well-stocked.</p>
        
        {/* Add inventory visualization even when everything is well-stocked */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium flex items-center mb-4 text-gray-700">
              <FiPieChart className="mr-2" /> Inventory Status
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="text-md font-medium flex items-center mb-4 text-gray-700">
              <FiBarChart2 className="mr-2" /> Category Distribution
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      {/* Inventory Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
          <FiTrendingUp className="mr-2" /> Inventory Overview
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium flex items-center mb-4 text-gray-700">
              <FiPieChart className="mr-2" /> Inventory Status
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium flex items-center mb-4 text-gray-700">
              <FiBarChart2 className="mr-2" /> Stock Levels by Category
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inStock" stackId="a" fill="#10B981" name="In Stock" />
                  <Bar dataKey="lowStock" stackId="a" fill="#F59E0B" name="Low Stock" />
                  <Bar dataKey="outOfStock" stackId="a" fill="#EF4444" name="Out of Stock" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Out of Stock Alerts */}
      {outOfStockProducts.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg shadow-lg w-full">
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
        <div className="bg-amber-50 p-6 rounded-lg shadow-lg w-full">
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
