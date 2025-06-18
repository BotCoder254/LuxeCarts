import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiSettings, FiSave, FiClock, FiEdit, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ModificationStatus } from '../../types/order';

const OrderModificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pendingModifications, setPendingModifications] = useState([]);
  const [settings, setSettings] = useState({
    defaultMaxModifications: 3,
    modificationDeadlineHours: 24,
    allowCancellations: true,
    requireReason: true
  });

  useEffect(() => {
    const fetchOrdersAndSettings = async () => {
      setLoading(true);
      try {
        // Fetch orders with pending modifications
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const ordersData = [];
        const pendingMods = [];
        
        ordersSnapshot.forEach(doc => {
          const orderData = { id: doc.id, ...doc.data() };
          
          // Add any orders with pending modifications
          if (orderData.modifications && orderData.modifications.length > 0) {
            ordersData.push(orderData);
            
            // Add pending modifications to a separate array
            orderData.modifications.forEach(mod => {
              if (mod.status === ModificationStatus.PENDING) {
                pendingMods.push({
                  orderId: orderData.id,
                  orderNumber: orderData.id.slice(-6),
                  customerName: orderData.shippingDetails?.name,
                  ...mod
                });
              }
            });
          }
        });
        
        setOrders(ordersData);
        setPendingModifications(pendingMods);
        
        // TODO: Fetch global settings from Firestore
        // For now, we'll use the default settings
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrdersAndSettings();
  }, []);

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Create a settings document in Firestore
      const settingsRef = doc(db, 'settings', 'orderModificationSettings');
      await updateDoc(settingsRef, {
        defaultMaxModifications: settings.defaultMaxModifications,
        modificationDeadlineHours: settings.modificationDeadlineHours,
        allowCancellations: settings.allowCancellations,
        requireReason: settings.requireReason,
        updatedAt: new Date()
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleModificationResponse = async (modificationId, orderId, status, responseText = '') => {
    try {
      // Find the order
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) {
        toast.error('Order not found');
        return;
      }
      
      // Update the modification
      const updatedModifications = orderToUpdate.modifications.map(mod => {
        if (mod.id === modificationId) {
          return {
            ...mod,
            status,
            responseDate: new Date(),
            responseText,
            respondedBy: 'Admin'
          };
        }
        return mod;
      });
      
      // Update in Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        modifications: updatedModifications,
        updatedAt: new Date()
      });
      
      // Update local state
      setPendingModifications(pendingModifications.filter(mod => mod.id !== modificationId));
      
      toast.success(`Modification request ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating modification:', error);
      toast.error('Failed to update modification');
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Order Modification Settings</h1>
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={loading}
          >
            <FiSave /> Save Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <FiSettings className="mr-2" /> Global Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Max Modifications Allowed
                </label>
                <select
                  value={settings.defaultMaxModifications}
                  onChange={(e) => setSettings({...settings, defaultMaxModifications: parseInt(e.target.value)})}
                  className="w-full border rounded-md p-2"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of modifications a customer can request for an order
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modification Deadline (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.modificationDeadlineHours}
                  onChange={(e) => setSettings({...settings, modificationDeadlineHours: parseInt(e.target.value)})}
                  className="w-full border rounded-md p-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Time window after order placement during which modifications are allowed
                </p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={settings.allowCancellations}
                    onChange={(e) => setSettings({...settings, allowCancellations: e.target.checked})}
                    className="mr-2"
                  />
                  Allow Cancellations
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  If disabled, customers cannot cancel orders once placed
                </p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={settings.requireReason}
                    onChange={(e) => setSettings({...settings, requireReason: e.target.checked})}
                    className="mr-2"
                  />
                  Require Reason for Cancellation
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  If enabled, customers must provide a reason when cancelling
                </p>
              </div>
            </div>
          </div>

          {/* Pending Modifications */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <FiEdit className="mr-2" /> Pending Modification Requests
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                {pendingModifications.length}
              </span>
            </h2>
            
            {pendingModifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No pending modification requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingModifications.map((mod) => (
                      <tr key={mod.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{mod.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mod.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {mod.requestDate?.toDate
                            ? mod.requestDate.toDate().toLocaleDateString()
                            : new Date(mod.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {mod.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleModificationResponse(mod.id, mod.orderId, ModificationStatus.APPROVED)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleModificationResponse(mod.id, mod.orderId, ModificationStatus.REJECTED)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiXCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Recent Activity Section */}
            {orders.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-md font-medium mb-4 flex items-center">
                  <FiClock className="mr-2" /> Recent Modification Activity
                </h3>
                
                <div className="space-y-3">
                  {orders.slice(0, 5).flatMap(order => 
                    order.modifications
                      .filter(mod => mod.status !== ModificationStatus.PENDING)
                      .slice(0, 2)
                      .map(mod => (
                        <div key={mod.id} className="flex items-start text-sm">
                          <span className={`flex-shrink-0 h-4 w-4 rounded-full mr-2 mt-1 ${
                            mod.status === ModificationStatus.APPROVED ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {mod.status === ModificationStatus.APPROVED ? 
                              <FiCheckCircle className="h-4 w-4 text-green-600" /> : 
                              <FiXCircle className="h-4 w-4 text-red-600" />
                            }
                          </span>
                          <div>
                            <p className="text-gray-900">
                              Modification request for order #{order.id.slice(-6)} was {mod.status.toLowerCase()}
                            </p>
                            <p className="text-gray-500">
                              {mod.responseDate?.toDate
                                ? mod.responseDate.toDate().toLocaleString()
                                : new Date(mod.responseDate).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderModificationSettings; 