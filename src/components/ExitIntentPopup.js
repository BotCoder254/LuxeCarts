import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiGift } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if the popup has been shown in this session
    const popupShown = sessionStorage.getItem('exitPopupShown');
    if (popupShown) {
      setHasShown(true);
      return;
    }

    let timer;
    
    const handleMouseLeave = (e) => {
      // Only trigger when mouse moves to the top of the page (likely exiting)
      if (e.clientY <= 5 && !hasShown) {
        // Add a small delay to make sure it's an actual exit intent
        timer = setTimeout(() => {
          setIsVisible(true);
          setHasShown(true);
          // Store in session storage so it doesn't show again in this session
          sessionStorage.setItem('exitPopupShown', 'true');
        }, 300);
      }
    };

    // Wait a few seconds before enabling the exit intent detection
    const enableTimer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
      clearTimeout(enableTimer);
    };
  }, [hasShown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // In a real app, you would send this to your backend
    toast.success('Thank you for subscribing! Your discount code is WELCOME10');
    setIsVisible(false);
    
    // Store in localStorage to remember this user subscribed
    localStorage.setItem('subscribed', 'true');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render anything if we've already shown the popup
  if (localStorage.getItem('subscribed')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md overflow-hidden"
          >
            <div className="relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
              
              {/* Content */}
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <FiGift className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Wait! Don't Leave Empty-Handed
                </h2>
                
                <p className="text-center text-gray-600 mb-6">
                  Subscribe to our newsletter and get 10% off your first order!
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Get My Discount
                  </button>
                </form>
                
                <p className="mt-4 text-xs text-center text-gray-500">
                  By subscribing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup; 