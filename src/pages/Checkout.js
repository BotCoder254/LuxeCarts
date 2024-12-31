import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { clearCart } from '../store/slices/cartSlice';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { FiCreditCard, FiShoppingBag, FiTruck, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { inputStyles } from '../styles/commonStyles';
import { stripePromise, CARD_ELEMENT_OPTIONS, handleStripeError } from '../config/stripe';

const SHIPPING_COST = 0;
const FREE_SHIPPING_THRESHOLD = 100;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
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

  const finalTotal = total >= FREE_SHIPPING_THRESHOLD ? total : total + SHIPPING_COST;

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe is not initialized. Please try again.');
      return;
    }

    // Validate form fields
    if (!shippingDetails.name || !shippingDetails.email || !shippingDetails.phone || 
        !shippingDetails.address || !shippingDetails.city || !shippingDetails.state || 
        !shippingDetails.zipCode || !shippingDetails.country) {
      toast.error('Please fill in all shipping details.');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent using Firebase Cloud Function
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      let clientSecret;
      try {
        const result = await createPaymentIntent({
          amount: Math.round(finalTotal * 100), // Convert to cents
          currency: 'usd',
          customer_email: shippingDetails.email,
        });
        
        if (!result.data || !result.data.clientSecret) {
          throw new Error('Invalid response from payment service');
        }
        
        clientSecret = result.data.clientSecret;
      } catch (error) {
        console.error('Payment intent creation error:', error);
        throw new Error(error.message || 'Failed to initialize payment. Please check your payment details and try again.');
      }

      // Confirm payment
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingDetails.name,
            email: shippingDetails.email,
            phone: shippingDetails.phone,
            address: {
              line1: shippingDetails.address,
              city: shippingDetails.city,
              state: shippingDetails.state,
              postal_code: shippingDetails.zipCode,
              country: shippingDetails.country,
            },
          },
        },
      });

      if (paymentResult.error) {
        throw paymentResult.error;
      }

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items,
        total: finalTotal,
        shippingDetails,
        paymentIntentId: paymentResult.paymentIntent.id,
        status: 'processing',
        createdAt: serverTimestamp(),
      });

      dispatch(clearCart());
      navigate('/order-success', {
        state: {
          orderId: orderRef.id,
          total: finalTotal,
        },
      });
      toast.success('Order placed successfully!');

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(handleStripeError(error));
    } finally {
      setLoading(false);
    }
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
              <label className={inputStyles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                required
                value={shippingDetails.phone}
                onChange={handleShippingChange}
                className={inputStyles.base}
                placeholder="Enter your phone number"
              />
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
            <FiCreditCard className="mr-2" /> Payment Information
          </h3>
          <div className="space-y-6">
            <div>
              <label className={inputStyles.label}>Card Details</label>
              <div className="mt-1">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                For testing, use card number: 4242 4242 4242 4242
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
          disabled={!stripe || loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium mb-2 flex items-center">
            <FiLock className="mr-2" /> Secure Checkout
          </h4>
          <p className="text-sm text-gray-600">
            Your payment information is processed securely. We do not store credit card details.
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
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </motion.div>
    </div>
  );
};

export default Checkout; 
