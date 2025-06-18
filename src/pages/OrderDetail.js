import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiPackage, FiTruck, FiCheck, FiArrowLeft, FiRefreshCw, FiMapPin, FiShield, FiDownload, FiEdit, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ModificationStatus } from '../types/order';

const OrderStatusSteps = ({ currentStatus }) => {
  const steps = [
    { status: 'processing', icon: <FiPackage />, label: 'Processing' },
    { status: 'shipped', icon: <FiTruck />, label: 'Shipped' },
    { status: 'delivered', icon: <FiCheck />, label: 'Delivered' }
  ];

  const currentStepIndex = steps.findIndex(step => step.status === currentStatus);

  return (
    <div className="flex w-full justify-between relative">
      {steps.map((step, index) => (
        <div key={step.status} className="flex flex-col items-center relative z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              index <= currentStepIndex
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {step.icon}
          </div>
          <p
            className={`mt-2 text-sm ${
              index <= currentStepIndex ? 'text-indigo-600 font-medium' : 'text-gray-500'
            }`}
          >
            {step.label}
          </p>
        </div>
      ))}

      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
      <div
        className="absolute top-5 left-0 h-0.5 bg-indigo-600"
        style={{
          width:
            currentStepIndex === 0
              ? '0%'
              : currentStepIndex === 1
              ? '50%'
              : '100%'
        }}
      />
    </div>
  );
};

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [modificationDescription, setModificationDescription] = useState('');
  const [isEditingOrder, setIsEditingOrder] = useState(false);

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

  const handleReorder = () => {
    if (!order || !order.items || order.items.length === 0) {
      toast.error('Cannot reorder: No items found in this order');
      return;
    }

    // Add all items from the order to the cart
    order.items.forEach(item => {
      dispatch(addToCart(item));
    });

    toast.success('All items added to your cart');
    navigate('/cart');
  };

  // Check if order is modifiable
  const canModifyOrder = () => {
    // Only orders in processing can be modified
    if (order.status !== 'processing') return false;
    
    // Check if there's a deadline for modifications
    if (order.modificationDeadline) {
      const deadline = order.modificationDeadline.toDate 
        ? order.modificationDeadline.toDate() 
        : new Date(order.modificationDeadline);
      
      if (new Date() > deadline) return false;
    } else {
      // If no specific deadline, use a default of 24 hours
      const orderDate = order.createdAt.toDate 
        ? order.createdAt.toDate() 
        : new Date(order.createdAt);
      
      const modificationWindow = new Date(orderDate.getTime() + (24 * 60 * 60 * 1000));
      if (new Date() > modificationWindow) return false;
    }
    
    // Check if max number of modifications has been reached
    const modCount = order.modifications?.length || 0;
    const maxMods = order.maxModificationsAllowed || 3; // Default to 3 if not set
    
    return modCount < maxMods;
  };

  // Submit modification request
  const submitModificationRequest = async () => {
    if (!modificationDescription.trim()) {
      toast.error('Please provide details for your modification request');
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      const newModification = {
        id: uuidv4(),
        description: modificationDescription,
        status: ModificationStatus.PENDING,
        requestDate: new Date(),
        requestedBy: order.userId
      };

      // Get current modifications or initialize empty array
      const modifications = order.modifications || [];
      
      // Update the order in Firestore
      await updateDoc(orderRef, {
        modifications: [...modifications, newModification],
        modificationCount: modifications.length + 1,
        updatedAt: new Date()
      });
      
      // Update local state
      setOrder({
        ...order,
        modifications: [...modifications, newModification],
        modificationCount: modifications.length + 1,
        updatedAt: new Date()
      });
      
      setShowModificationModal(false);
      setModificationDescription('');
      toast.success('Modification request submitted');
    } catch (error) {
      console.error('Error submitting modification request:', error);
      toast.error('Failed to submit modification request');
    }
  };

  // Generate invoice
  const generateInvoice = () => {
    try {
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // Indigo color
      doc.text('LuxeCarts - Invoice', 105, 20, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      
      // Add order details
      doc.setFontSize(12);
      doc.text(`Invoice #: INV-${order.id.slice(-6)}`, 20, 40);
      doc.text(`Order #: ${order.id.slice(-6)}`, 20, 50);
      doc.text(`Date: ${order.createdAt.toDate().toLocaleDateString()}`, 20, 60);
      
      // Add customer details
      doc.text(`Customer: ${order.shippingDetails.name}`, 20, 75);
      doc.text(`Email: ${order.shippingDetails.email}`, 20, 85);
      doc.text(`Phone: ${order.shippingDetails.phone}`, 20, 95);
      
      // Add shipping address
      doc.text('Shipping Address:', 20, 110);
      doc.text(order.shippingDetails.address, 30, 120);
      doc.text(`${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}`, 30, 130);
      doc.text(order.shippingDetails.country, 30, 140);
      
      // Add items table
      const tableData = order.items.map(item => [
        item.name,
        item.quantity,
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);
      
      doc.autoTable({
        startY: 160,
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
      
      // Add footer
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.text('Thank you for shopping with LuxeCarts!', 105, finalY + 50, { align: 'center' });
      
      // Save the PDF
      doc.save(`luxecarts-invoice-${order.id.slice(-6)}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/orders"
            className="flex items-center text-indigo-600 hover:text-indigo-900"
          >
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
          <div className="flex space-x-4">
            <button
              onClick={handleReorder}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw /> Reorder
            </button>
            <button
              onClick={generateInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <FiDownload /> Download Invoice
            </button>
            {canModifyOrder() && (
              <button
                onClick={() => setShowModificationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <FiEdit /> Request Changes
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
              <p className="text-gray-500">
                {order.createdAt.toDate
                  ? moment(order.createdAt.toDate()).format('MMMM D, YYYY')
                  : moment(order.createdAt).format('MMMM D, YYYY')}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.status === 'shipped'
                  ? 'bg-blue-100 text-blue-800'
                  : order.status === 'delivered'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          {order.status !== 'cancelled' && order.status !== 'pending' && (
            <div className="mt-8">
              <OrderStatusSteps currentStatus={order.status} />
            </div>
          )}

          {/* Modification Requests Section */}
          {order.modifications && order.modifications.length > 0 && (
            <div className="mt-8 pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Modification Requests</h3>
              <div className="space-y-4">
                {order.modifications.map((mod) => (
                  <div 
                    key={mod.id} 
                    className={`p-4 rounded-lg border ${
                      mod.status === ModificationStatus.APPROVED
                        ? 'border-green-200 bg-green-50'
                        : mod.status === ModificationStatus.REJECTED
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Requested on {mod.requestDate?.toDate
                          ? moment(mod.requestDate.toDate()).format('MMM D, YYYY')
                          : moment(mod.requestDate).format('MMM D, YYYY')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        mod.status === ModificationStatus.APPROVED
                          ? 'bg-green-100 text-green-800'
                          : mod.status === ModificationStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mod.status === ModificationStatus.PENDING ? 'Pending' :
                         mod.status === ModificationStatus.APPROVED ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    <p className="text-gray-900">{mod.description}</p>
                    {mod.responseText && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Response:</span> {mod.responseText}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {canModifyOrder() && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    You can make {order.maxModificationsAllowed - order.modifications.length} more modification requests for this order.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
              {order.isPickupInStore ? (
                <div>
                  <div className="flex items-center text-indigo-600 mb-3">
                    <FiMapPin className="mr-2" />
                    <span className="font-medium">Pickup In-Store</span>
                  </div>
                  <p className="text-gray-600">
                    {order.pickupLocation?.name || 'Store pickup'}
                  </p>
                  <p className="text-gray-600">
                    {order.pickupLocation?.address || ''}
                  </p>
                  <p className="mt-4 text-sm text-gray-500">
                    Please bring your ID and order number when picking up your order.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-3">
                    {order.hasInsurance ? (
                      <div className="flex items-center text-indigo-600">
                        <FiShield className="mr-2" />
                        <span className="font-medium">Insured Shipping</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-700">
                        <FiTruck className="mr-2" />
                        <span className="font-medium">Standard Shipping</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-gray-800 font-medium">
                      {order.shippingDetails.name}
                    </p>
                    <p className="text-gray-600">{order.shippingDetails.address}</p>
                    <p className="text-gray-600">
                      {order.shippingDetails.city}, {order.shippingDetails.state}{' '}
                      {order.shippingDetails.zipCode}
                    </p>
                    <p className="text-gray-600">{order.shippingDetails.country}</p>
                    <p className="text-gray-600">{order.shippingDetails.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">
                    {order.paymentMethod || 'Credit Card'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span
                    className={`font-medium ${
                      order.paymentStatus === 'completed'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-medium text-gray-800">
                      {order.paymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between pb-4 border-b">
                  <div className="flex">
                    <img
                      src={item.image || item.images?.[0] || 'https://via.placeholder.com/80?text=No+Image'}
                      alt={item.name}
                      className="h-20 w-20 object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                    <div className="ml-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>${order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {order.hasInsurance && order.insuranceCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance</span>
                    <span>${order.insuranceCost.toFixed(2)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modification Request Modal */}
      {showModificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Request Order Modification</h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe the changes you'd like to make to your order. Please note that your request must be approved by our team.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modification Details
              </label>
              <textarea
                value={modificationDescription}
                onChange={(e) => setModificationDescription(e.target.value)}
                className="w-full border rounded-md p-2 h-32"
                placeholder="For example: 'Please change the shipping address to...' or 'I'd like to add one more item to my order...'"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitModificationRequest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                disabled={!modificationDescription.trim()}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail; 