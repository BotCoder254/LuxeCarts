import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

const EngagementMetrics = ({ orders }) => {
  // Calculate total savings (assuming 10% average discount)
  const totalSavings = orders.reduce((acc, order) => 
    order.paymentStatus === 'completed' ? acc + (order.total * 0.1) : acc, 0);
  
  // Calculate most purchased categories
  const getCategoryStats = () => {
    if (!orders || orders.length === 0) {
      return [];
    }

    const categories = {};
    orders.forEach(order => {
      if (order.paymentStatus === 'completed') {
        order.items.forEach(item => {
          categories[item.category] = (categories[item.category] || 0) + 1;
        });
      }
    });
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  };

  const categoryData = getCategoryStats();
  const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

  const completedOrders = orders.filter(order => order.paymentStatus === 'completed');
  const totalSpent = completedOrders.reduce((acc, order) => acc + order.total, 0);

  const stats = [
    {
      icon: <FiShoppingBag className="w-6 h-6" />,
      title: 'Total Orders',
      value: completedOrders.length
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: 'Total Spent',
      value: `$${totalSpent.toFixed(2)}`
    },
    {
      icon: <FiTrendingUp className="w-6 h-6" />,
      title: 'Estimated Savings',
      value: `$${totalSavings.toFixed(2)}`
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Stats Cards */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Key Metrics</h3>
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Category Distribution</h3>
        {categoryData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">No category data available yet</p>
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600">{category.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default EngagementMetrics;
