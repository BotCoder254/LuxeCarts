import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiShoppingBag, FiTruck, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { inputStyles } from '../styles/commonStyles';

const SHIPPING_COST = 0;
const FREE_SHIPPING_THRESHOLD = 100;

const CheckoutForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [error, setError] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [orderRef, setOrderRef] = useState(null);

  const finalTotal = total >= FREE_SHIPPING_THRESHOLD ? total : total + SHIPPING_COST;

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    try {
      const response = await fetch('http://localhost:5000/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: shippingDetails.phone,
          amount: Math.round(finalTotal)
        })
      });

      const responseClone = response.clone();
      let data;
      
      try {
        data = await response.json();
      } catch (error) {
        const textData = await responseClone.text();
        console.error('Failed to parse JSON:', textData);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      if (data.ResponseCode === "0") {
        // Payment initiated successfully
        toast.loading('Processing payment...', { duration: 15000 });
        
        // Wait for 15 seconds then check payment status
        setTimeout(async () => {
          try {
            const statusResponse = await fetch(`http://localhost:5000/payment-status/${data.CheckoutRequestID}`);
            const statusData = await statusResponse.json();

            if (statusData.ResultCode === "0") {
              // Payment successful
              const orderRef = await addDoc(collection(db, 'orders'), {
                userId: user.uid,
                items,
                total: finalTotal,
                shippingDetails: shippingDetails,
                paymentStatus: 'completed',
                status: 'processing',
                checkoutRequestId: data.CheckoutRequestID,
                createdAt: serverTimestamp()
              });

              // Clear cart after successful order
              dispatch(clearCart());
              
              toast.success('Payment successful! Order placed.');
              navigate(`/order/${orderRef.id}`);
            } else if (statusData.ResultCode === "1032") {
              // Cancelled by user
              toast.error('Payment cancelled by user');
            } else {
              // Other payment failure
              toast.error(statusData.ResultDesc || 'Payment failed');
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
            toast.error('Failed to verify payment status');
          }
        }, 15000);
      } else {
        throw new Error(data.ResponseDescription || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!shippingDetails.name || !shippingDetails.email || !shippingDetails.phone || 
        !shippingDetails.address || !shippingDetails.city || !shippingDetails.state || 
        !shippingDetails.zipCode || !shippingDetails.country) {
      toast.error('Please fill in all shipping details.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Initiate payment first
      await handlePayment();
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = async (checkoutRequestID) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up new polling interval
    const interval = setInterval(async () => {
      try {
        const response = await fetch("http://localhost:8000/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({
            queryCode: checkoutRequestID
          }),
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Payment status response:', data);

        // Handle successful response
        if (data.ResponseCode === "0" && orderRef) {
          // Payment successful
          setPaymentStatus('Payment successful!');
          clearInterval(interval);
          setPollingInterval(null);

          // Update order status
          await updateDoc(orderRef, {
            status: 'processing',
            paymentStatus: 'completed',
            updatedAt: serverTimestamp(),
            isVisible: true // Make visible to admin
          });
          
          // Clear cart and navigate
          dispatch(clearCart());
          navigate('/order-success', {
            state: {
              orderId: orderRef.id,
              total: finalTotal,
            }
          });
          toast.success('Payment successful! Order placed.');
        } else if (data.ResponseCode === "2" || data.isProcessing) {
          // Payment is still processing
          setPaymentStatus('Payment processing... Please wait.');
        } else if (data.ResponseCode === "3" || data.isCanceled) {
          // Payment was canceled
          clearInterval(interval);
          setPollingInterval(null);
          
          // Update order status
          await updateDoc(orderRef, {
            status: 'canceled',
            paymentStatus: 'canceled',
            error: data.ResultDesc || data.errorMessage,
            updatedAt: serverTimestamp(),
            isVisible: false // Hide from admin until payment is successful
          });

          setPaymentStatus('Payment canceled');
          toast.error('Transaction was canceled. Please try again.');
          throw new Error('Transaction was canceled');
        } else if (data.ResponseCode === "1" && orderRef) {
          // Payment failed
          clearInterval(interval);
          setPollingInterval(null);
          
          // Update order status
          await updateDoc(orderRef, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            error: data.ResultDesc || data.errorMessage,
            updatedAt: serverTimestamp(),
            isVisible: false // Hide from admin until payment is successful
          });

          setPaymentStatus('Payment failed');
          toast.error(data.ResultDesc || data.errorMessage || 'Payment failed');
          throw new Error(data.ResultDesc || data.errorMessage || 'Payment failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        setError(error.message || 'Failed to check payment status. Please try again.');
        
        // Only clear interval if it's a fatal error (not processing)
        if (!error.message.includes('processing')) {
          clearInterval(interval);
          setPollingInterval(null);
          toast.error(error.message || 'Failed to check payment status');
        }
      }
    }, 5000);

    setPollingInterval(interval);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Shipping Details */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiTruck className="mr-2" /> Shipping Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className={inputStyles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={shippingDetails.name}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className={inputStyles.label}>Email</label>
              <input
                type="email"
                name="email"
                required
                value={shippingDetails.email}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className={inputStyles.label}>Phone (M-Pesa)</label>
              <input
                type="tel"
                name="phone"
                required
                value={shippingDetails.phone}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="254XXXXXXXXX"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter your M-Pesa number starting with 254
              </p>
            </div>
            <div className="col-span-2">
              <label className={inputStyles.label}>Address</label>
              <textarea
                name="address"
                required
                value={shippingDetails.address}
                onChange={handleShippingChange}
                className={inputStyles.textarea}
                placeholder="Enter your street address"
              />
            </div>
            <div>
              <label className={inputStyles.label}>City</label>
              <input
                type="text"
                name="city"
                required
                value={shippingDetails.city}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your city"
              />
            </div>
            <div>
              <label className={inputStyles.label}>State</label>
              <input
                type="text"
                name="state"
                required
                value={shippingDetails.state}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your state"
              />
            </div>
            <div>
              <label className={inputStyles.label}>ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                required
                value={shippingDetails.zipCode}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your ZIP code"
              />
            </div>
            <div>
              <label className={inputStyles.label}>Country</label>
              <input
                type="text"
                name="country"
                required
                value={shippingDetails.country}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your country"
              />
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiLock className="mr-2" /> Payment Information
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Payment will be processed via M-Pesa. You will receive a prompt on your phone to complete the payment.
            </p>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-700">
                Make sure your M-Pesa number {shippingDetails.phone} is correct and has sufficient funds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiShoppingBag className="mr-2" /> Order Summary
          </h3>
          <div className="space-y-4">
            {items.map((item) => (
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
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{total >= FREE_SHIPPING_THRESHOLD ? 'Free' : `$${SHIPPING_COST.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : `Pay KES ${finalTotal.toFixed(2)} with M-Pesa`}
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium mb-2 flex items-center">
            <FiLock className="mr-2" /> Secure Checkout
          </h4>
          <p className="text-sm text-gray-600">
            Your payment will be processed securely through M-Pesa. You will receive a prompt on your phone to complete the transaction.
          </p>
        </div>
      </div>
    </form>
  );
};

const Checkout = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <CheckoutForm />
      </motion.div>
    </div>
  );
};

export default Checkout; 
