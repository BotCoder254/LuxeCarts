import React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { Link, useNavigate } from 'react-router-dom';

import { removeFromCart, updateQuantity, clearCart } from '../store/slices/cartSlice';

import { FiTrash2, FiShoppingBag, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi';

import { motion } from 'framer-motion';

import toast from 'react-hot-toast';



const CartItem = ({ item, onUpdateQuantity, onRemove }) => {

  const handleImageError = (e) => {

    e.target.onerror = null;

    e.target.src = 'https://via.placeholder.com/150?text=No+Image';

  };



  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      exit={{ opacity: 0, y: -20 }}

      className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-md mb-4"

    >

      <div className="relative w-24 h-24 flex-shrink-0">

        <img

          src={item.images?.[0] || item.image || 'https://via.placeholder.com/150?text=No+Image'}

          alt={item.name}

          className="w-24 h-24 object-cover rounded"

          onError={handleImageError}

        />

      </div>

      <div className="flex-1 text-center sm:text-left">

        <Link 

          to={`/product/${item.id}`}

          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"

        >

          {item.name}

        </Link>

        {item.selectedSize && (

          <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>

        )}

        {item.selectedColor && (

          <div className="flex items-center gap-2 justify-center sm:justify-start">

            <span className="text-sm text-gray-600">Color:</span>

            <div

              className="w-4 h-4 rounded-full border border-gray-300"

              style={{ backgroundColor: item.selectedColor }}

            />

          </div>

        )}

      </div>

      

      <div className="flex items-center gap-2">

        <button

          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}

          className="p-1 rounded-full hover:bg-gray-100 transition-colors"

          disabled={item.quantity <= 1}

        >

          <FiMinus className="w-4 h-4" />

        </button>

        <span className="w-12 text-center font-medium">{item.quantity}</span>

        <button

          onClick={() => onUpdateQuantity(item.id, Math.min(10, item.quantity + 1))}

          className="p-1 rounded-full hover:bg-gray-100 transition-colors"

          disabled={item.quantity >= 10}

        >

          <FiPlus className="w-4 h-4" />

        </button>

      </div>

      

      <div className="text-right">

        <p className="text-lg font-bold text-gray-900">

          ${(item.price * item.quantity).toFixed(2)}

        </p>

        <p className="text-sm text-gray-500">

          ${item.price.toFixed(2)} each

        </p>

      </div>

      

      <button

        onClick={() => onRemove(item.id)}

        className="text-red-500 hover:text-red-700 transition-colors p-2"

      >

        <FiTrash2 size={20} />

      </button>

    </motion.div>

  );

};



const Cart = () => {

  const { items, total } = useSelector((state) => state.cart);

  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const navigate = useNavigate();



  const handleQuantityChange = (id, quantity) => {

    dispatch(updateQuantity({ id, quantity }));

  };



  const handleRemoveItem = (id) => {

    dispatch(removeFromCart(id));

    toast.success('Item removed from cart');

  };



  const handleClearCart = () => {

    if (window.confirm('Are you sure you want to clear your cart?')) {

      dispatch(clearCart());

      toast.success('Cart cleared');

    }

  };



  const handleCheckout = () => {

    if (!user) {

      toast.error('Please login to checkout');

      navigate('/login');

      return;

    }

    navigate('/checkout');

  };



  if (items.length === 0) {

    return (

      <div className="container mx-auto px-4 py-16 text-center">

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

        >

          <FiShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />

          <h2 className="text-2xl font-bold text-gray-900 mb-4">

            Your cart is empty

          </h2>

          <p className="text-gray-600 mb-8">

            Looks like you haven't added any items to your cart yet.

          </p>

          <Link

            to="/products"

            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"

          >

            Continue Shopping <FiArrowRight />

          </Link>

        </motion.div>

      </div>

    );

  }



  return (

    <div className="container mx-auto px-4 py-8">

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>

        <button

          onClick={handleClearCart}

          className="text-red-600 hover:text-red-800 flex items-center gap-2"

        >

          <FiTrash2 /> Clear Cart

        </button>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-4">

          {items.map((item) => (

            <CartItem

              key={item.id}

              item={item}

              onUpdateQuantity={handleQuantityChange}

              onRemove={handleRemoveItem}

            />

          ))}

        </div>



        <div className="lg:col-span-1">

          <div className="bg-white p-6 rounded-lg shadow-md">

            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            

            <div className="space-y-4 mb-6">

              <div className="flex justify-between text-gray-600">

                <span>Subtotal ({items.length} items)</span>

                <span>${total.toFixed(2)}</span>

              </div>

              <div className="flex justify-between text-gray-600">

                <span>Shipping</span>

                <span>Free</span>

              </div>

              {total < 100 && (

                <div className="text-sm text-indigo-600">

                  Add ${(100 - total).toFixed(2)} more for free shipping

                </div>

              )}

              <div className="border-t pt-4">

                <div className="flex justify-between font-bold text-lg">

                  <span>Total</span>

                  <span>${total.toFixed(2)}</span>

                </div>

              </div>

            </div>



            <button

              onClick={handleCheckout}

              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"

            >

              Proceed to Checkout <FiArrowRight />

            </button>



            <Link

              to="/products"

              className="block text-center mt-4 text-indigo-600 hover:text-indigo-800"

            >

              Continue Shopping

            </Link>

          </div>



          {/* Secure Shopping Section */}

          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">

            <h3 className="font-semibold text-gray-900 mb-4">Secure Shopping</h3>

            <div className="space-y-3 text-sm text-gray-600">

              <div className="flex items-center gap-2">

                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />

                </svg>

                <span>Secure SSL Encryption</span>

              </div>

              <div className="flex items-center gap-2">

                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />

                </svg>

                <span>Safe & Secure Payments</span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default Cart; 
