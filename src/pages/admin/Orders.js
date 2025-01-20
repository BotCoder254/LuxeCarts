import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiShoppingBag, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
        
        // Use onSnapshot instead of getDocs to listen for real-time updates
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(ordersData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching orders:', error);
          toast.error('Unable to load orders. Please try again.');
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up orders listener:', error);
        toast.error('Unable to load orders. Please try again.');
        setLoading(false);
      }
    };

    fetchOrders();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    if (updating) return;
    setUpdating(orderId);
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="text-sm text-gray-600">
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.shippingDetails.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.paymentStatus ? 
                          order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) :
                          'Not Available'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <FiEye className="mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              No orders have been placed yet.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminOrders; 