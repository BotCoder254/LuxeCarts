import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSelector } from 'react-redux';
import OrderHistoryChart from '../components/analytics/OrderHistoryChart';
import EngagementMetrics from '../components/analytics/EngagementMetrics';
import InteractionHeatmap from '../components/analytics/InteractionHeatmap';
import { motion } from 'framer-motion';
import { FiActivity } from 'react-icons/fi';

const UserAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Fetch orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setOrders(ordersData);
    });

    // Fetch interactions (simulated data for heatmap)
    const simulateInteractions = () => {
      const data = [];
      for (let i = 0; i < 50; i++) {
        data.push({
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          count: Math.floor(Math.random() * 100)
        });
      }
      setInteractions(data);
    };
    simulateInteractions();

    setLoading(false);

    return () => {
      unsubscribeOrders();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Please log in to view analytics</h2>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-indigo-100 rounded-full">
          <FiActivity className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Your Analytics Dashboard</h1>
          <p className="text-gray-600">Track your shopping patterns and engagement</p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 gap-8">
        <OrderHistoryChart orders={orders} />
        <EngagementMetrics orders={orders} />
        <InteractionHeatmap interactions={interactions} />
      </div>
    </motion.div>
  );
};

export default UserAnalytics;
