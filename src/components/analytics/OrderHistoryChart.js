import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const OrderHistoryChart = ({ orders }) => {
  // Process orders data for monthly spending
  const processOrderData = () => {
    if (!orders || orders.length === 0) {
      return [];
    }

    const monthlyData = {};
    orders.forEach(order => {
      if (order.paymentStatus === 'completed') {
        const date = new Date(order.createdAt);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + order.total;
      }
    });

    return Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total: parseFloat(total.toFixed(2))
    }));
  };

  const data = processOrderData();

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Monthly Spending History</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">No order history available yet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Monthly Spending History</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#4F46E5" name="Total Spending ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default OrderHistoryChart;
