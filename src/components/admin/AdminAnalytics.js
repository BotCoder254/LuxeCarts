import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiUsers } from 'react-icons/fi';

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

const AdminAnalytics = ({ orders, users, products }) => {
  // Process data for revenue trend
  const getRevenueTrend = () => {
    const monthlyRevenue = {};
    orders.forEach(order => {
      if (order.paymentStatus === 'completed') {
        const date = new Date(order.createdAt);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + order.total;
      }
    });

    return Object.entries(monthlyRevenue).map(([month, total]) => ({
      month,
      revenue: parseFloat(total.toFixed(2))
    }));
  };

  // Process data for category distribution
  const getCategoryDistribution = () => {
    const categories = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
      });
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));
  };

  const revenueTrend = getRevenueTrend();
  const categoryData = getCategoryDistribution();

  // Calculate key metrics
  const totalRevenue = orders.reduce((sum, order) => 
    order.paymentStatus === 'completed' ? sum + order.total : sum, 0);
  const averageOrderValue = totalRevenue / (orders.filter(o => o.paymentStatus === 'completed').length || 1);
  const conversionRate = (orders.length / (users.length || 1) * 100).toFixed(1);

  const metrics = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: <FiDollarSign className="w-6 h-6" />
    },
    {
      title: 'Average Order Value',
      value: `$${averageOrderValue.toFixed(2)}`,
      icon: <FiShoppingBag className="w-6 h-6" />
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: <FiTrendingUp className="w-6 h-6" />
    },
    {
      title: 'Active Users',
      value: users.length,
      icon: <FiUsers className="w-6 h-6" />
    }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{metric.title}</p>
                <p className="text-2xl font-bold mt-2">{metric.value}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                {metric.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg w-full"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Revenue Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4F46E5"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg w-full"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Category Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-2 gap-2 content-center">
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
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;
