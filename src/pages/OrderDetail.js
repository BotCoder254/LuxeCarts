import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiPackage, FiTruck, FiCheck, FiArrowLeft, FiImage } from 'react-icons/fi';
import { motion } from 'framer-motion';
import moment from 'moment';
import toast from 'react-hot-toast';

const OrderStatusSteps = ({ currentStatus }) => {
  const steps = [
    { status: 'processing', icon: <FiPackage />, label: 'Processing' },
    { status: 'shipped', icon: <FiTruck />, label: 'Shipped' },
    { status: 'delivered', icon: <FiCheck />, label: 'Delivered' },
  ];

  const currentStep = steps.findIndex(step => step.status === currentStatus);

  return (
    <div className="py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`mt-2 text-sm ${
                  index <= currentStep ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-1 mx-2 ${
                  index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        } else {
          toast.error('Order not found');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Error loading order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = 'https://via.placeholder.com/150?text=No+Image';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">Order not found</p>
        <Link
          to="/orders"
          className="text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-2"
        >
          <FiArrowLeft /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              to="/orders"
              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mb-2"
            >
              <FiArrowLeft /> Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id.slice(-6)}
            </h1>
            <p className="text-gray-600">
              Placed on {moment(order.createdAt?.toDate()).format('MMMM D, YYYY h:mm A')}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              order.status === 'delivered'
                ? 'bg-green-100 text-green-800'
                : order.status === 'shipped'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        <OrderStatusSteps currentStatus={order.status} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <img
                            src={item.images?.[0] || item.image || 'https://via.placeholder.com/150?text=No+Image'}
                            alt={item.name}
                            className="h-16 w-16 object-cover rounded"
                            onError={handleImageError}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary and Shipping Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {order.shippingDetails.name}
                </p>
                <p className="text-gray-600">{order.shippingDetails.address}</p>
                <p className="text-gray-600">
                  {order.shippingDetails.city}, {order.shippingDetails.state}{' '}
                  {order.shippingDetails.zipCode}
                </p>
                <p className="text-gray-600">{order.shippingDetails.country}</p>
                <p className="text-gray-600 pt-2">
                  Phone: {order.shippingDetails.phone}
                </p>
                <p className="text-gray-600">
                  Email: {order.shippingDetails.email}
                </p>
              </div>
            </div>

            {order.status === 'delivered' && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <FiCheck className="w-5 h-5" />
                  <p className="font-medium">
                    Delivered on {moment(order.deliveredAt?.toDate()).format('MMMM D, YYYY')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetail; 