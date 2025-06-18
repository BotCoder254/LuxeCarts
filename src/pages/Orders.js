import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSelector, useDispatch } from 'react-redux';
import { FiShoppingBag, FiDownload, FiEye, FiX, FiRefreshCw, FiMapPin, FiTruck, FiShield, FiEdit } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addToCart } from '../store/slices/cartSlice';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

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
        status: 'cancelled',
        paymentStatus: 'canceled',
        isVisible: false,
        cancelReason: 'Canceled by user',
        cancelDate: new Date(),
        updatedAt: new Date()
      });
      toast.success('Order canceled successfully');
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Failed to cancel order');
    }
  };
  
  const handleReorder = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      toast.error('Cannot reorder: No items found in this order');
      return;
    }

    // Add all items from the order to the cart
    order.items.forEach(item => {
      dispatch(addToCart(item));
    });

    toast.success('All items added to your cart');
  };

  // Improved invoice generation with custom styling
  const generateInvoice = (order) => {
    try {
      const doc = new jsPDF();
      
      // Add receipt header with better styling
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // Indigo color
      doc.text('LuxeCarts Invoice', 105, 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Add logo placeholder (would be replaced with actual logo)
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 30, 40, 15, 'F');
      doc.setFontSize(8);
      doc.text('LOGO', 40, 40, { align: 'center' });
      
      // Add order details
      doc.setFontSize(12);
      doc.text(`Invoice #: INV-${order.id.slice(-6)}`, 20, 55);
      doc.text(`Order #: ${order.id.slice(-6)}`, 20, 62);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, 20, 69);
      
      // Add customer details on the right
      doc.text(`Bill To:`, 140, 55);
      doc.text(`${order.shippingDetails.name}`, 140, 62);
      doc.text(`${order.shippingDetails.email}`, 140, 69);
      doc.text(`${order.shippingDetails.phone}`, 140, 76);
      
      // Add shipping address
      doc.text('Shipping Address:', 20, 83);
      doc.setFontSize(10);
      doc.text(order.shippingDetails.address, 20, 90);
      doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}`, 20, 97);
      doc.text(order.shippingDetails.country, 20, 104);
      
      // Add items table with better styling
      const tableData = order.items.map(item => [
        item.name,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: 115,
        head: [['Item', 'Quantity', 'Price', 'Total']],
        body: tableData,
        foot: [
          ['', '', 'Subtotal:', `$${order.total.toFixed(2)}`],
          ['', '', 'Shipping:', `${order.shippingCost > 0 ? `$${order.shippingCost.toFixed(2)}` : 'Free'}`],
          order.hasInsurance ? ['', '', 'Insurance:', `$${order.insuranceCost.toFixed(2)}`] : null,
          ['', '', 'Total:', `$${order.total.toFixed(2)}`]
        ].filter(Boolean),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        footStyles: { fillColor: [240, 240, 250], textColor: [0, 0, 0] }
      });
      
      // Add payment status with styling
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFillColor(245, 245, 245);
      doc.rect(20, finalY + 15, 170, 10, 'F');
      doc.setFontSize(10);
      doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 25, finalY + 22);
      doc.text(`Transaction ID: ${order.checkoutRequestId || 'N/A'}`, 120, finalY + 22);
      
      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for shopping with LuxeCarts!', 105, finalY + 40, { align: 'center' });
      doc.text('For any questions, please contact support@luxecarts.com', 105, finalY + 47, { align: 'center' });
      
      // Add signature line
      doc.setDrawColor(200, 200, 200);
      doc.line(130, finalY + 65, 180, finalY + 65);
      doc.text('Authorized Signature', 155, finalY + 70, { align: 'center' });
      
      // Save the PDF
      doc.save(`luxecarts-invoice-${order.id.slice(-6)}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  // Check if an order can be modified
  const canModifyOrder = (order) => {
    // Only processing orders can be modified
    if (order.status !== 'processing') return false;
    
    // Check modification deadline if it exists
    if (order.modificationDeadline) {
      const deadline = order.modificationDeadline.toDate ? 
        order.modificationDeadline.toDate() : new Date(order.modificationDeadline);
      if (new Date() > deadline) return false;
    }
    
    // Check modification count
    const modCount = order.modificationCount || 0;
    const maxMods = order.maxModificationsAllowed || 3; // Default to 3 if not specified
    return modCount < maxMods;
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
                    {canModifyOrder(order) && (
                      <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FiEdit className="mr-1" size={12} /> Modifiable
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center text-indigo-600 hover:text-indigo-900"
                    >
                      <FiRefreshCw className="mr-1" />
                      Reorder
                    </button>
                    <button
                      onClick={() => generateInvoice(order)}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      <FiDownload className="mr-1" />
                      Invoice
                    </button>
                    {order.status === 'processing' && (
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
                      <p className="mt-1 text-sm text-gray-600">
                        {order.items.reduce((total, item) => total + item.quantity, 0)} items
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="mt-1 text-sm text-gray-600">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Display pickup or delivery info */}
                <div className="mt-4 pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    {order.isPickupInStore ? (
                      <span className="flex items-center">
                        <FiMapPin className="mr-1 text-indigo-600" /> 
                        Pickup in store
                        {order.pickupLocation && (
                          <span className="ml-2">
                            - {order.pickupLocation.name}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiTruck className="mr-1" /> 
                        Standard delivery
                        {order.hasInsurance && (
                          <span className="ml-2 text-indigo-600 flex items-center">
                            <FiShield className="mr-1" /> Insured
                            {order.insurancePlan && (
                              <span className="ml-1">
                                ({order.insurancePlan.name})
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start shopping to see your orders here.
            </p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse Products
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Orders; 