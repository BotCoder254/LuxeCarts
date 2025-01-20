import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiPackage, FiTruck, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        
        // Set up real-time listener for order updates
        unsubscribe = onSnapshot(orderRef, (doc) => {
          if (doc.exists()) {
            const orderData = { id: doc.id, ...doc.data() };
            setOrder(orderData);
            
            // Check payment status when order data changes
            if (orderData.paymentStatus !== 'completed') {
              checkPaymentStatus(orderData.checkoutRequestId);
            }
          } else {
            toast.error('Order not found');
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching order:', error);
          toast.error('Error loading order details');
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up order listener:', error);
        toast.error('Error loading order details');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId]);

  const checkPaymentStatus = async (checkoutRequestId) => {
    if (!checkoutRequestId) return;

    try {
      const response = await fetch(`http://localhost:5000/payment-status/${checkoutRequestId}`);
      const data = await response.json();

      if (data.ResultCode === "0") {
        // Payment successful, update order
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          paymentStatus: 'completed',
          updatedAt: new Date()
        });
      } else if (data.ResultCode === "1032") {
        // Payment cancelled
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          paymentStatus: 'cancelled',
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (!order || updating) return;
    
    // Check if payment is completed before allowing status update
    if (order.paymentStatus !== 'completed') {
      toast.error('Cannot update status: Payment not completed');
      return;
    }

    setUpdating(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      if (newStatus === 'delivered') {
        // Remove the toast success message for delivered status
        const shouldDownload = window.confirm('Order marked as delivered. Would you like to download the receipt?');
        if (shouldDownload) {
          generateReceipt(order);
        }
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
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
      doc.text(`Date: ${order.createdAt.toDate().toLocaleDateString()}`, 20, 50);
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

      // Immediately show delete confirmation after download
      const shouldDelete = window.confirm('Would you like to delete this order now?');
      if (shouldDelete) {
        deleteOrder(order.id);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      toast.success('Order deleted successfully');
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleStatusChange = (e) => {
    updateOrderStatus(e.target.value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Order not found</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h2>
            <p className="text-gray-600">
              Placed on {order.createdAt.toDate().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={order.status}
                onChange={handleStatusChange}
                disabled={updating}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => updateOrderStatus('processing')}
                disabled={updating || order.status === 'processing'}
                className={`px-4 py-2 rounded ${
                  order.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                <FiPackage className="inline mr-2" />
                Processing
              </button>
              <button
                onClick={() => updateOrderStatus('shipped')}
                disabled={updating || order.status === 'shipped'}
                className={`px-4 py-2 rounded ${
                  order.status === 'shipped'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                <FiTruck className="inline mr-2" />
                Shipped
              </button>
              <button
                onClick={() => updateOrderStatus('delivered')}
                disabled={updating || order.status === 'delivered'}
                className={`px-4 py-2 rounded ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
              >
                <FiCheck className="inline mr-2" />
                Delivered
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {order.shippingDetails.name}</p>
              <p><span className="font-medium">Email:</span> {order.shippingDetails.email}</p>
              <p><span className="font-medium">Phone:</span> {order.shippingDetails.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <div className="space-y-2">
              <p>{order.shippingDetails.address}</p>
              <p>{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</p>
              <p>{order.shippingDetails.country}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4">
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
          </div>

          <div className="mt-6 text-right">
            <p className="text-lg font-semibold">Total: ${order.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetails; 