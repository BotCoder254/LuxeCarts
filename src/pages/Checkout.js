import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../store/slices/cartSlice';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiShoppingBag, FiTruck, FiLock, FiCreditCard } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import swal from 'sweetalert';
import { inputStyles } from '../styles/commonStyles';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// Define a Paystack public key
const PAYSTACK_PUBLIC_KEY = 'pk_live_f75e7fc5c652583410d16789fc9955853373fc8c';

const SHIPPING_COST = 0;
const FREE_SHIPPING_THRESHOLD = 100;

// Stripe Card Element styles
const cardElementStyle = {
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
};

const CheckoutForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // 'mpesa', 'stripe', or 'paystack'
  const stripe = useStripe();
  const elements = useElements();
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
  const [isLoading, setIsLoading] = useState(false);

  // Add useEffect to load Paystack script
  useEffect(() => {
    // Load Paystack script if not already loaded
    if (paymentMethod === 'paystack' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [paymentMethod]);

  const finalTotal = total >= FREE_SHIPPING_THRESHOLD ? total : total + SHIPPING_COST;

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order first with pending status
      const orderDocRef = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items,
        total: finalTotal,
        shippingDetails,
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: serverTimestamp(),
        isVisible: false,
        paymentMethod: 'stripe'
      });

      setOrderRef(orderDocRef);

      // Create payment intent with improved error handling
      const response = await fetch(process.env.REACT_APP_STRIPE_SERVER_URL + '/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100),
          currency: 'usd',
          customer_email: shippingDetails.email,
          customer_name: shippingDetails.name,
          shipping: {
            name: shippingDetails.name,
            address: {
              line1: shippingDetails.address,
              city: shippingDetails.city,
              state: shippingDetails.state,
              postal_code: shippingDetails.zipCode,
              country: shippingDetails.country
            }
          },
          metadata: {
            order_id: orderDocRef.id
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment server error:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        throw new Error('Unable to process payment. Please try again.');
      }

      const data = await response.json();
      
      if (!data || !data.clientSecret) {
        throw new Error('Invalid response from payment server');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
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
              country: shippingDetails.country
            }
          }
        }
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        let errorMessage = 'Payment failed. ';
        
        if (stripeError.type === 'card_error') {
          switch (stripeError.code) {
            case 'card_declined':
              errorMessage += 'Your card was declined.';
              break;
            case 'expired_card':
              errorMessage += 'Your card has expired.';
              break;
            case 'incorrect_cvc':
              errorMessage += 'The security code is incorrect.';
              break;
            case 'processing_error':
              errorMessage += 'An error occurred while processing your card.';
              break;
            case 'insufficient_funds':
              errorMessage += 'Your card has insufficient funds.';
              break;
            default:
              errorMessage += stripeError.message || 'Please try again.';
          }
        } else {
          errorMessage += 'Please check your card details and try again.';
        }
        throw new Error(errorMessage);
      }

      if (paymentIntent.status === 'succeeded') {
        await updateDoc(orderDocRef, {
          status: 'processing',
          paymentStatus: 'completed',
          updatedAt: serverTimestamp(),
          isVisible: true,
          stripePaymentIntentId: paymentIntent.id,
          paymentDetails: {
            last4: paymentIntent.payment_method_details?.card?.last4,
            brand: paymentIntent.payment_method_details?.card?.brand,
            paymentMethodType: paymentIntent.payment_method_types?.[0]
          }
        });

        dispatch(clearCart());
        navigate('/order-success', {
          state: {
            orderId: orderDocRef.id,
            total: finalTotal,
          }
        });
        toast.success('Payment successful! Order placed.');
      } else {
        throw new Error('Payment was not completed. Please try again.');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      
      if (orderRef) {
        try {
          await updateDoc(orderRef, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            error: error.message,
            updatedAt: serverTimestamp()
          });
        } catch (updateError) {
          console.error('Failed to update order status:', updateError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async (orderDocRef) => {
    setIsLoading(true);
    
    try {
      // Convert to USD cents (Paystack requires amount in smallest currency unit)
      const finalAmountUSD = Math.round(finalTotal * 100);
      const userEmail = shippingDetails.email;
      const selectedMonth = new Date().toLocaleString('default', { month: 'long' });
      const displayAmount = finalTotal.toFixed(2);
      
      // Function to handle successful payment
      const processPayment = async (
        payMethod, 
        currency, 
        responseReference, 
        responseTrans, 
        selectedMonth, 
        finalAmount, 
        displayAmount
      ) => {
        try {
          // Update order with payment details
          await updateDoc(orderDocRef, {
            status: 'processing',
            paymentStatus: 'completed',
            updatedAt: serverTimestamp(),
            isVisible: true,
            paymentMethod: payMethod,
            paymentDetails: {
              currency: currency,
              reference: responseReference,
              transaction: responseTrans,
              month: selectedMonth,
              amount: finalAmount,
              displayAmount: displayAmount
            }
          });
          
          // Clear cart and navigate to success page
          dispatch(clearCart());
          navigate('/order-success', {
            state: {
              orderId: orderDocRef.id,
              total: finalTotal,
            }
          });
          toast.success('Payment successful! Order placed.');
        } catch (error) {
          console.error('Error updating order after payment:', error);
          swal('Error', 'There was a problem processing your payment', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      
      // Initialize Paystack payment
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY || 'pk_live_f75e7fc5c652583410d16789fc9955853373fc8c',
          email: userEmail,
          amount: finalAmountUSD,
          currency: "USD",
          callback: function(response) {
            if (response.status === 'success') {
              // Proceed with your logic, e.g., updating the database or displaying a success message
              const payMethod = "Paystack - USD";
              const currency = "USD";
              const responseReference = response.reference;
              const responseTrans = response.trans;
              
              processPayment(
                payMethod, 
                currency, 
                responseReference, 
                responseTrans, 
                selectedMonth, 
                finalTotal, 
                displayAmount
              );
            } else {
              swal('Payment Error', 'Payment failed or was not successful', 'error');
              setIsLoading(false);
            }
          },
          onClose: function() {
            // Handle payment cancellation
            swal('Payment Error', 'Transaction was not completed, action canceled', 'error');
            setIsLoading(false);
          }
        });

        // Open the Paystack payment modal
        handler.openIframe();
      } else {
        throw new Error('Paystack not loaded');
      }
    } catch (error) {
      console.error('Paystack payment error:', error);
      swal('Payment Error', error.message || 'Failed to initialize payment', 'error');
      setIsLoading(false);
      
      // Update order status if payment failed
      if (orderDocRef) {
        try {
          await updateDoc(orderDocRef, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            error: error.message,
            updatedAt: serverTimestamp()
          });
        } catch (updateError) {
          console.error('Failed to update order status:', updateError);
        }
      }
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

    if (paymentMethod === 'stripe') {
      await handleStripePayment();
    } else if (paymentMethod === 'paystack') {
      setLoading(true);
      setError('');

      try {
        // Create order first with pending status
        const orderDocRef = await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          items,
          total: finalTotal,
          shippingDetails,
          paymentStatus: 'pending',
          status: 'pending',
          createdAt: serverTimestamp(),
          isVisible: false,
          paymentMethod: 'paystack'
        });

        setOrderRef(orderDocRef);
        // Process payment with Paystack
        await handlePaystackPayment(orderDocRef);
        
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'An error occurred during checkout. Please try again.');
        setLoading(false);
      }
    } else {
      setLoading(true);
      setError('');

      let newOrderRef = null;

      try {
        // Create order first with pending status
        const orderDocRef = await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          items,
          total: finalTotal,
          shippingDetails,
          paymentStatus: 'pending',
          status: 'pending',
          createdAt: serverTimestamp(),
          isVisible: false // Hide from admin until payment is successful
        });

        newOrderRef = orderDocRef;
        setOrderRef(orderDocRef);

        // Then initiate payment using the local reference
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/stkpush`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            phone: shippingDetails.phone,
            amount: Math.round(finalTotal),
            orderId: orderDocRef.id
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
          setCheckoutRequestID(data.CheckoutRequestID);
          setShowPaymentStatus(true);
          
          // Start polling for payment status with the local reference
          startPolling(data.CheckoutRequestID, orderDocRef);
        } else {
          throw new Error(data.ResponseDescription || 'Failed to initiate payment');
        }
        
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'An error occurred during checkout. Please try again.');
        
        // Update order status if payment failed
        if (newOrderRef) {
          await updateDoc(newOrderRef, {
            status: 'payment_failed',
            paymentStatus: 'failed',
            error: error.message,
            updatedAt: serverTimestamp()
          });
        }
      }
    }
  };

  const startPolling = async (checkoutRequestID, docRef) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up new polling interval
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/query`, {
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

        const orderDocRef = doc(db, 'orders', docRef.id);

        // Handle successful response
        if (data.isSuccessful) {
          // Payment successful
          setPaymentStatus('Payment successful!');
          clearInterval(interval);
          setPollingInterval(null);

          // Update order status
          try {
            await updateDoc(orderDocRef, {
              status: 'processing',
              paymentStatus: 'completed',
              updatedAt: serverTimestamp(),
              isVisible: true // Make visible to admin
            });
          } catch (updateError) {
            console.error('Error updating order:', updateError);
          }
          
          // Clear cart and navigate
          dispatch(clearCart());
          navigate('/order-success', {
            state: {
              orderId: docRef.id,
              total: finalTotal,
            }
          });
          toast.success('Payment successful! Order placed.');
        } else if (data.isProcessing) {
          // Payment is still processing
          setPaymentStatus('Payment processing... Please wait.');
          try {
            await updateDoc(orderDocRef, {
              status: 'processing',
              paymentStatus: 'processing',
              updatedAt: serverTimestamp()
            });
          } catch (updateError) {
            console.error('Error updating order status:', updateError);
          }
        } else if (data.isCanceled) {
          // Payment was canceled
          clearInterval(interval);
          setPollingInterval(null);
          
          // Update order status
          try {
            await updateDoc(orderDocRef, {
              status: 'canceled',
              paymentStatus: 'canceled',
              error: data.ResultDesc || data.errorMessage,
              updatedAt: serverTimestamp(),
              isVisible: false // Hide from admin until payment is successful
            });
          } catch (updateError) {
            console.error('Error updating order status:', updateError);
          }

          setPaymentStatus('Payment canceled');
          toast.error('Transaction was canceled. Please try again.');
          throw new Error('Transaction was canceled');
        } else {
          // Payment failed
          clearInterval(interval);
          setPollingInterval(null);
          
          // Update order status
          try {
            await updateDoc(orderDocRef, {
              status: 'payment_failed',
              paymentStatus: 'failed',
              error: data.ResultDesc || data.errorMessage,
              updatedAt: serverTimestamp(),
              isVisible: false // Hide from admin until payment is successful
            });
          } catch (updateError) {
            console.error('Error updating order status:', updateError);
          }

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
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Shipping Details */}
      <div className="space-y-6 w-full">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiTruck className="mr-2" /> Shipping Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="w-full">
              <label className={inputStyles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={shippingDetails.name}
                onChange={handleShippingChange}
                className={`${inputStyles.base} w-full`}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="w-full">
                <label className={inputStyles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={shippingDetails.email}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="Enter your email"
                />
              </div>
              <div className="w-full">
                <label className={inputStyles.label}>Phone (M-Pesa)</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={shippingDetails.phone}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="254XXXXXXXXX"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter your M-Pesa number starting with 254
                </p>
              </div>
            </div>
            <div className="w-full">
              <label className={inputStyles.label}>Address</label>
              <textarea
                name="address"
                required
                value={shippingDetails.address}
                onChange={handleShippingChange}
                className={`${inputStyles.textarea} w-full`}
                placeholder="Enter your street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="w-full">
                <label className={inputStyles.label}>City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={shippingDetails.city}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="Enter your city"
                />
              </div>
              <div className="w-full">
                <label className={inputStyles.label}>State</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={shippingDetails.state}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="Enter your state"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="w-full">
                <label className={inputStyles.label}>ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={shippingDetails.zipCode}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="Enter your ZIP code"
                />
              </div>
              <div className="w-full">
                <label className={inputStyles.label}>Country</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={shippingDetails.country}
                  onChange={handleShippingChange}
                  className={`${inputStyles.base} w-full`}
                  placeholder="Enter your country"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section - Modified to include payment method selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiLock className="mr-2" /> Payment Information
          </h3>
          <div className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex-1 py-2 px-4 rounded-md ${
                  paymentMethod === 'mpesa'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 py-2 px-4 rounded-md ${
                  paymentMethod === 'stripe'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('paystack')}
                className={`flex-1 py-2 px-4 rounded-md ${
                  paymentMethod === 'paystack'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Paystack
              </button>
            </div>

            {paymentMethod === 'mpesa' ? (
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
            ) : paymentMethod === 'stripe' ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <CardElement options={cardElementStyle} />
                </div>
                <p className="text-sm text-gray-600">
                  Your card will be charged securely through Stripe.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Payment will be processed through Paystack.
                </p>
              </div>
            )}
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
              <div key={item.id} className="flex justify-between items-center py-2">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md">
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    {item.finalPrice && item.finalPrice < item.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 line-through">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-green-600">
                          ${item.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-medium text-gray-900">
                  ${((item.finalPrice || item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {items.some(item => item.finalPrice && item.finalPrice < item.price) && (
                <div className="flex justify-between text-sm">
                  <span>Discounts</span>
                  <span className="text-green-600">
                    -${items.reduce((acc, item) => {
                      const discount = item.finalPrice && item.finalPrice < item.price
                        ? (item.price - item.finalPrice) * item.quantity
                        : 0;
                      return acc + discount;
                    }, 0).toFixed(2)}
                  </span>
                </div>
              )}
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
          disabled={loading || (paymentMethod === 'stripe' && !stripe) || (paymentMethod === 'paystack' && isLoading)}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'mpesa'
            ? `Pay KES ${finalTotal.toFixed(2)} with M-Pesa`
            : paymentMethod === 'stripe'
            ? `Pay $${finalTotal.toFixed(2)} with Card`
            : 'Pay with Paystack'}
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
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </motion.div>
    </div>
  );
};

export default Checkout; 
