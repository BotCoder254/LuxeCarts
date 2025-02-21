import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiShoppingBag, FiEye, FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  // Add function to check and delete old delivered orders
  const checkAndDeleteOldOrders = async (orders) => {
    const now = new Date();
    orders.forEach(async (order) => {
      if (order.status === 'delivered' && order.updatedAt && order.updatedAt.toDate) {
        try {
          const deliveredDate = order.updatedAt.toDate(); // Convert to JavaScript Date
          const hoursSinceDelivered = (now - deliveredDate) / (1000 * 60 * 60);

          if (hoursSinceDelivered >= 24) {
            await deleteDoc(doc(db, 'orders', order.id));
            console.log(`Deleted order ${order.id} after 24 hours of delivery`);
          }
        } catch (error) {
          console.error('Error deleting old order:', error);
        }
      } else {
        console.warn(`Order ${order.id} has an invalid or missing updatedAt field. Skipping deletion.`);
      }
    });
  };

  // Add function to generate detailed receipt
  const generateDetailedReceipt = (order) => {
    try {
      const doc = new jsPDF();

      // Add header with logo
      doc.setFontSize(20);
      doc.text('LuxeCarts - Order Details', 105, 20, { align: 'center' });

      // Add order information
      doc.setFontSize(12);
      doc.text(`Order ID: #${order.id.slice(-6)}`, 20, 40);
      doc.text(`Date: ${order.createdAt.toDate().toLocaleDateString()}`, 20, 50);
      doc.text(`Status: ${order.status.toUpperCase()}`, 20, 60);

      // Add customer details
      doc.text('Customer Information:', 20, 80);
      doc.text(`Name: ${order.shippingDetails.name}`, 30, 90);
      doc.text(`Email: ${order.shippingDetails.email}`, 30, 100);
      doc.text(`Phone: ${order.shippingDetails.phone}`, 30, 110);

      // Add shipping address
      doc.text('Shipping Address:', 20, 130);
      doc.text(order.shippingDetails.address, 30, 140);
      doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}`, 30, 150);
      doc.text(order.shippingDetails.country, 30, 160);

      // Add order items table
      const tableData = order.items.map(item => [
        item.name,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 180,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: tableData,
        foot: [
          ['', '', 'Total:', `$${order.total.toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        footStyles: { fillColor: [79, 70, 229] }
      });

      // Add payment information
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.text('Payment Information:', 20, finalY + 20);
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 30, finalY + 30);
      doc.text(`Payment Method: M-PESA`, 30, finalY + 40);

      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for shopping with LuxeCarts!', 105, finalY + 60, { align: 'center' });

      // Save the PDF
      doc.save(`order-details-${order.id.slice(-6)}.pdf`);
      toast.success('Order details downloaded successfully');
    } catch (error) {
      console.error('Error generating order PDF:', error);
      toast.error('Failed to generate order details');
    }
  };

  // Helper function to format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); // Handle Firebase Timestamp
    return 'N/A';
  };

  useEffect(() => {
    let unsubscribe;

    const fetchOrders = async () => {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt : new Date(), // Keep as Timestamp
                updatedAt: data.updatedAt ? data.updatedAt : new Date() // Keep as Timestamp
              };
            })
            .filter(order => order.paymentStatus === 'completed');

          setOrders(ordersData);
          setLoading(false);
          setError(null);
          // Check and delete old delivered orders
          checkAndDeleteOldOrders(ordersData);
        }, (err) => {
          console.error('Error fetching orders:', err);
          setError(err.message);
          setLoading(false);
          toast.error('Unable to load orders. Please try again.');
        });
      } catch (err) {
        console.error('Error setting up orders listener:', err);
        setError(err.message);
        setLoading(false);
        toast.error('Unable to load orders. Please try again.');
      }
    };

    fetchOrders();

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

      // Update order status
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
        notificationSent: false
      });

      // Send status update notification
      const response = await fetch('https://luxecarts-mpesa.onrender.com/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send status update notification');
      }

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
        <div className="text-center text-red-600">Error loading orders: {error}</div>
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
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Showing {orders.length} completed order{orders.length !== 1 ? 's' : ''}
            </div>
            <Link
              to="/?preview=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={(e) => {
                e.preventDefault();
                const previewUrl = window.location.origin + '/?preview=true';
                window.open(previewUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
              View Store
            </Link>
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
                      {formatDate(order.createdAt)}
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
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => generateDetailedReceipt(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Download Receipt"
                        >
                          <FiDownload className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <FiEye className="mr-1" />
                          View
                        </button>
                      </div>
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