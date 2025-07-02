import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiShoppingBag, FiEye, FiDownload, FiPrinter, FiFileText } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  // Add function to print order details
  const printOrder = (order) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Generate HTML content for the print window
      printWindow.document.write(`
        <html>
          <head>
            <title>Order #${order.id.slice(-6)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .order-info { margin-bottom: 20px; }
              .order-details { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total-row { font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              @media print {
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>LuxeCarts - Order Details</h1>
              <button onclick="window.print()">Print Order</button>
            </div>

            <div class="order-info">
              <h2>Order #${order.id.slice(-6)}</h2>
              <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
            </div>

            <div class="order-details">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${order.shippingDetails.name}</p>
              <p><strong>Email:</strong> ${order.shippingDetails.email}</p>
              <p><strong>Phone:</strong> ${order.shippingDetails.phone}</p>
              
              <h3>Shipping Address</h3>
              <p>${order.shippingDetails.address}</p>
              <p>${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}</p>
              <p>${order.shippingDetails.country}</p>
            </div>

            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right;">Total:</td>
                  <td>$${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p>Thank you for shopping with LuxeCarts!</p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
          </body>
        </html>
      `);
      
      // Focus on the new window
      printWindow.document.close();
      printWindow.focus();
      
      toast.success('Order ready for printing');
    } catch (error) {
      console.error('Error printing order:', error);
      toast.error('Failed to print order');
    }
  };

  // Add function to export all orders to Excel
  const exportOrdersToExcel = () => {
    try {
      // Convert orders to exportable format
      const exportData = orders.map(order => ({
        'Order ID': `#${order.id.slice(-6)}`,
        'Customer': order.shippingDetails.name,
        'Email': order.shippingDetails.email,
        'Phone': order.shippingDetails.phone,
        'Date': formatDate(order.createdAt),
        'Status': order.status,
        'Payment Status': order.paymentStatus,
        'Total': `$${order.total.toFixed(2)}`,
        'Items Count': order.items.length,
        'Address': `${order.shippingDetails.address}, ${order.shippingDetails.city}, ${order.shippingDetails.state}, ${order.shippingDetails.zipCode}, ${order.shippingDetails.country}`
      }));

      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      
      // Generate Excel file
      const currentDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `LuxeCarts_Orders_${currentDate}.xlsx`);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
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
            
            <button
              onClick={exportOrdersToExcel}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiFileText className="mr-2 -ml-1 h-5 w-5" />
              Export Orders
            </button>
            
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
                          onClick={() => printOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print Order"
                        >
                          <FiPrinter className="w-5 h-5" />
                        </button>
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