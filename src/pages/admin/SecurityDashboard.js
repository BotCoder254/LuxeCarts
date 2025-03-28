import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiClock, FiMapPin } from 'react-icons/fi';
import SecurityAlert from '../../components/security/SecurityAlert';

const SecurityDashboard = () => {
  const [securityLogs, setSecurityLogs] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    highRiskAlerts: 0,
    unusualLogins: 0,
    suspiciousTransactions: 0,
  });

  useEffect(() => {
    // Listen for security logs
    const logsQuery = query(
      collection(db, 'securityLogs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));
      setSecurityLogs(logs);

      // Update stats
      const highRisk = logs.filter(log => 
        log.eventType === 'high_risk_transaction' || 
        log.eventType === 'suspicious_login'
      ).length;

      const unusualLogins = logs.filter(log => 
        log.eventType === 'unusual_location' || 
        log.eventType === 'new_device'
      ).length;

      const suspiciousTransactions = logs.filter(log => 
        log.eventType === 'high_risk_transaction'
      ).length;

      setStats({
        totalAlerts: logs.length,
        highRiskAlerts: highRisk,
        unusualLogins,
        suspiciousTransactions,
      });
    });

    // Listen for active alerts - Modified query to avoid index requirement
    const alertsQuery = query(
      collection(db, 'securityAlerts'),
      where('status', '==', 'active')
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }))
      // Sort alerts client-side instead of using orderBy in query
      .sort((a, b) => b.timestamp - a.timestamp);
      
      setActiveAlerts(alerts);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeAlerts();
    };
  }, []);

  const handleDismissAlert = async (alertId) => {
    try {
      await updateDoc(doc(db, 'securityAlerts', alertId), {
        status: 'dismissed',
        dismissedAt: new Date(),
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Monitor and manage security alerts and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <FiShield className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Alerts</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAlerts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">High Risk Alerts</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.highRiskAlerts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiMapPin className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Unusual Logins</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.unusualLogins}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Suspicious Transactions</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.suspiciousTransactions}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
        </div>
        <div className="p-6">
          {activeAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active alerts</p>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map(alert => (
                <SecurityAlert
                  key={alert.id}
                  severity={alert.severity}
                  title={alert.title}
                  message={alert.message}
                  timestamp={alert.timestamp}
                  onDismiss={() => handleDismissAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Security Activity Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.eventType.includes('high_risk') ? 'bg-red-100 text-red-800' :
                      log.eventType.includes('suspicious') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {log.eventType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.userId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
