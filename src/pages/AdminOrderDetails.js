import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiShoppingBag, FiUser, FiTruck } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error || 'Order not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-8">Order Details #{order.id}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Information */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiShoppingBag className="mr-2" /> Order Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    order.status === 'processing' ? 'text-green-600' :
                    order.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium ${
                    order.paymentStatus === 'completed' ? 'text-green-600' :
                    order.paymentStatus === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiUser className="mr-2" /> Customer Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{order.shippingDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{order.shippingDetails.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{order.shippingDetails.phone}</span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiTruck className="mr-2" /> Shipping Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right">{order.shippingDetails.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium">{order.shippingDetails.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span className="font-medium">{order.shippingDetails.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ZIP Code:</span>
                  <span className="font-medium">{order.shippingDetails.zipCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium">{order.shippingDetails.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items and Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiShoppingBag className="mr-2" /> Order Items
              </h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                      <div className="ml-4">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {order.error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-red-800 font-medium mb-2">Error Information</h4>
                <p className="text-red-600">{order.error}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOrderDetails; 