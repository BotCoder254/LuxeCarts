import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSelector } from 'react-redux';
import { FiShoppingBag, FiDownload, FiEye, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    let unsubscribe;

    const fetchOrders = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // Query for all orders of the user without orderBy to avoid index requirement
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        
        // Real-time listener for orders with better error handling
        unsubscribe = onSnapshot(
          q, 
          (querySnapshot) => {
            try {
              const ordersData = [];
              querySnapshot.forEach((doc) => {
                try {
                  const data = doc.data();
                  ordersData.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
                    updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date()
                  });
                } catch (docError) {
                  console.error('Error processing document:', docError);
                }
              });
              
              // Sort orders by date client-side instead
              ordersData.sort((a, b) => b.createdAt - a.createdAt);
              
              setOrders(ordersData);
              setLoading(false);
            } catch (error) {
              console.error('Error processing orders data:', error);
              toast.error('Error loading orders data');
              setLoading(false);
            }
          },
          (error) => {
            console.error('Firestore subscription error:', error);
            toast.error('Unable to load your orders. Please try again.');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up orders listener:', error);
        toast.error('Unable to load your orders. Please refresh the page.');
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'canceled',
        paymentStatus: 'canceled',
        isVisible: false,
        updatedAt: new Date()
      });
      toast.success('Order canceled successfully');
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const generateReceipt = (order) => {
    try {
      const doc = new jsPDF();
      
      // Add receipt header
      doc.setFontSize(20);
      doc.text('Order Receipt', 105, 20, { align: 'center' });
      
      // Add order details
      doc.setFontSize(12);
      doc.text(`Order ID: #${order.id.slice(-6)}`, 20, 40);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, 20, 50);
      doc.text(`Customer: ${order.shippingDetails.name}`, 20, 60);
      doc.text(`Email: ${order.shippingDetails.email}`, 20, 70);
      doc.text(`Phone: ${order.shippingDetails.phone}`, 20, 80);
      
      // Add shipping address
      doc.text('Shipping Address:', 20, 95);
      doc.text(order.shippingDetails.address, 20, 105);
      doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}`, 20, 115);
      doc.text(order.shippingDetails.country, 20, 125);
      
      // Add items table
      const tableData = order.items.map(item => [
        item.name,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: 140,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: tableData,
        foot: [
          ['', '', 'Total:', `$${order.total.toFixed(2)}`]
        ],
      });
      
      // Add payment status
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 20, finalY + 20);
      doc.text(`Transaction ID: ${order.checkoutRequestId || 'N/A'}`, 20, finalY + 30);
      
      // Save the PDF
      doc.save(`order-receipt-${order.id.slice(-6)}.pdf`);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  // Filter orders to show only those with completed payments or in processing
  const displayOrders = orders.filter(order => 
    order.paymentStatus === 'completed' || 
    order.paymentStatus === 'processing' || 
    order.status === 'processing'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="text-sm text-gray-600">
            Showing {displayOrders.length} order{displayOrders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {displayOrders.length > 0 ? (
          <div className="space-y-6">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Order #{order.id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">
                      Placed on {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    {order.paymentStatus === 'completed' && (
                      <button
                        onClick={() => generateReceipt(order)}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                      >
                        <FiDownload className="mr-1" />
                        Receipt
                      </button>
                    )}
                    {order.status !== 'canceled' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center text-red-600 hover:text-red-900"
                      >
                        <FiX className="mr-1" />
                        Cancel
                      </button>
                    )}
                    <Link
                      to={`/order/${order.id}`}
                      className="flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <p className={`mt-1 text-sm ${
                        order.status === 'processing' ? 'text-green-600' :
                        order.status === 'pending' ? 'text-yellow-600' :
                        order.status === 'canceled' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Payment</p>
                      <p className={`mt-1 text-sm ${
                        order.paymentStatus === 'completed' ? 'text-green-600' :
                        order.paymentStatus === 'processing' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Items</p>
                      <p className="mt-1 text-sm text-gray-900">{order.items.length} items</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="mt-1 text-sm text-gray-900">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't placed any orders yet.
            </p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Orders; 