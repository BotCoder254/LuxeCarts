import React, { useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { useNavigate } from 'react-router-dom';

import { loadStripe } from '@stripe/stripe-js';

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { clearCart } from '../store/slices/cartSlice';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebase/config';

import { FiCreditCard, FiShoppingBag, FiTruck, FiLock } from 'react-icons/fi';

import { motion } from 'framer-motion';

import toast from 'react-hot-toast';



const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);



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

    if (!stripe || !elements) return;



    setLoading(true);



    try {

      // Create payment intent

      const response = await fetch('/api/create-payment-intent', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          amount: Math.round(finalTotal * 100), // Convert to cents

          currency: 'usd',

          customer_email: shippingDetails.email,

        }),

      });



      const { clientSecret } = await response.json();



      // Confirm payment

      const result = await stripe.confirmCardPayment(clientSecret, {

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



      if (result.error) {

        toast.error(result.error.message);

      } else {

        // Create order in Firestore

        const orderRef = await addDoc(collection(db, 'orders'), {

          userId: user.uid,

          items,

          total: finalTotal,

          shippingDetails,

          paymentIntentId: result.paymentIntent.id,

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

      }

    } catch (error) {

      toast.error('Something went wrong. Please try again.');

      console.error('Checkout error:', error);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="col-span-2">

              <label className="block text-sm font-medium text-gray-700">Full Name</label>

              <input

                type="text"

                name="name"

                required

                value={shippingDetails.name}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Email</label>

              <input

                type="email"

                name="email"

                required

                value={shippingDetails.email}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Phone</label>

              <input

                type="tel"

                name="phone"

                required

                value={shippingDetails.phone}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div className="col-span-2">

              <label className="block text-sm font-medium text-gray-700">Address</label>

              <input

                type="text"

                name="address"

                required

                value={shippingDetails.address}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">City</label>

              <input

                type="text"

                name="city"

                required

                value={shippingDetails.city}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">State</label>

              <input

                type="text"

                name="state"

                required

                value={shippingDetails.state}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>

              <input

                type="text"

                name="zipCode"

                required

                value={shippingDetails.zipCode}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">Country</label>

              <input

                type="text"

                name="country"

                required

                value={shippingDetails.country}

                onChange={handleShippingChange}

                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"

              />

            </div>

          </div>

        </div>



        {/* Payment Section */}

        <div className="bg-white p-6 rounded-lg shadow-md">

          <h3 className="text-lg font-semibold mb-4 flex items-center">

            <FiCreditCard className="mr-2" /> Payment Information

          </h3>

          <div className="space-y-4">

            <CardElement

              options={{

                style: {

                  base: {

                    fontSize: '16px',

                    color: '#424770',

                    '::placeholder': {

                      color: '#aab7c4',

                    },

                  },

                  invalid: {

                    color: '#9e2146',

                  },

                },

              }}

              className="p-3 border rounded-md"

            />

            <div className="flex items-center text-sm text-gray-500">

              <FiLock className="mr-2" />

              Your payment information is secure and encrypted

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

          <h4 className="font-medium mb-2">Secure Checkout</h4>

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
