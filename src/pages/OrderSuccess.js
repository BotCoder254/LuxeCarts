import React, { useEffect, useState } from 'react';

import { useLocation, Link, useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebase/config';

import { FiCheckCircle, FiPackage, FiTruck, FiMail } from 'react-icons/fi';

import { motion } from 'framer-motion';



const OrderSuccess = () => {

  const location = useLocation();

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);



  const orderId = location.state?.orderId;



  useEffect(() => {

    if (!orderId) {

      navigate('/');

      return;

    }



    const fetchOrder = async () => {

      try {

        const orderDoc = await getDoc(doc(db, 'orders', orderId));

        if (orderDoc.exists()) {

          setOrder({ id: orderDoc.id, ...orderDoc.data() });

        }

      } catch (error) {

        console.error('Error fetching order:', error);

      } finally {

        setLoading(false);

      }

    };



    fetchOrder();

  }, [orderId, navigate]);



  if (loading) {

    return (

      <div className="flex justify-center items-center min-h-screen">

        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>

      </div>

    );

  }



  if (!order) {

    return (

      <div className="text-center py-12">

        <p className="text-gray-600">Order not found</p>

        <Link

          to="/"

          className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"

        >

          Return to Home

        </Link>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-gray-50 py-12">

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

          className="bg-white rounded-lg shadow-lg overflow-hidden"

        >

          {/* Order Success Header */}

          <div className="bg-indigo-600 py-8 px-6 text-center">

            <FiCheckCircle className="mx-auto h-16 w-16 text-white" />

            <h1 className="mt-4 text-3xl font-bold text-white">

              Order Placed Successfully!

            </h1>

            <p className="mt-2 text-indigo-100">

              Thank you for shopping with LuxeCart

            </p>

          </div>



          {/* Order Details */}

          <div className="p-6">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-gray-900">

                Order Details

              </h2>

              <p className="mt-1 text-sm text-gray-600">

                Order ID: #{order.id.slice(-6)}

              </p>

            </div>



            {/* Order Items */}

            <div className="border rounded-lg overflow-hidden">

              <div className="divide-y divide-gray-200">

                {order.items.map((item) => (

                  <div key={item.id} className="p-4 flex items-center">

                    <img

                      src={item.image}

                      alt={item.name}

                      className="h-16 w-16 object-cover rounded"

                    />

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



            {/* Order Summary */}

            <div className="mt-6">

              <div className="bg-gray-50 rounded-lg p-4">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Subtotal</span>

                  <span className="font-medium">${order.total.toFixed(2)}</span>

                </div>

                <div className="flex justify-between text-sm mt-2">

                  <span className="text-gray-600">Shipping</span>

                  <span className="font-medium">Free</span>

                </div>

                <div className="flex justify-between text-base font-medium mt-4 pt-4 border-t">

                  <span>Total</span>

                  <span>${order.total.toFixed(2)}</span>

                </div>

              </div>

            </div>



            {/* Shipping Information */}

            <div className="mt-6">

              <h3 className="text-lg font-semibold text-gray-900 mb-4">

                Shipping Information

              </h3>

              <div className="bg-gray-50 rounded-lg p-4">

                <p className="text-sm text-gray-600">

                  {order.shippingDetails.name}

                </p>

                <p className="text-sm text-gray-600 mt-1">

                  {order.shippingDetails.address}

                </p>

                <p className="text-sm text-gray-600">

                  {order.shippingDetails.city}, {order.shippingDetails.state}{' '}

                  {order.shippingDetails.zipCode}

                </p>

                <p className="text-sm text-gray-600">

                  {order.shippingDetails.country}

                </p>

              </div>

            </div>



            {/* Next Steps */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold text-gray-900 mb-4">

                What's Next?

              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="text-center p-4 bg-gray-50 rounded-lg">

                  <FiMail className="mx-auto h-6 w-6 text-indigo-600" />

                  <p className="mt-2 text-sm text-gray-600">

                    Order confirmation email sent

                  </p>

                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">

                  <FiPackage className="mx-auto h-6 w-6 text-indigo-600" />

                  <p className="mt-2 text-sm text-gray-600">

                    Order processing started

                  </p>

                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">

                  <FiTruck className="mx-auto h-6 w-6 text-indigo-600" />

                  <p className="mt-2 text-sm text-gray-600">

                    Shipping updates coming soon

                  </p>

                </div>

              </div>

            </div>



            {/* Action Buttons */}

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

              <Link

                to="/orders"

                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"

              >

                View All Orders

              </Link>

              <Link

                to="/products"

                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"

              >

                Continue Shopping

              </Link>

            </div>

          </div>

        </motion.div>

      </div>

    </div>

  );

};



export default OrderSuccess; 
