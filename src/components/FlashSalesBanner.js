import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiArrowRight, FiTag } from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const FlashSalesBanner = () => {
  const [activeSale, setActiveSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Simplified query to avoid complex indexes
    const fetchActiveSales = async () => {
      try {
        const now = new Date();
        
        // Simple query with just one condition
        const q = query(
          collection(db, 'flashSales'),
          where('active', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setActiveSale(null);
          setLoading(false);
          return;
        }
        
        // Process and filter data client-side
        const salesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter sales that haven't expired yet
        const activeSales = salesData.filter(sale => {
          if (!sale.endDate) return false;
          const endDate = new Date(sale.endDate);
          return endDate > now;
        });
        
        if (activeSales.length === 0) {
          setActiveSale(null);
          setLoading(false);
          return;
        }
        
        // Sort by end date and get the one ending soonest
        activeSales.sort((a, b) => {
          const dateA = new Date(a.endDate);
          const dateB = new Date(b.endDate);
          return dateA - dateB;
        });
        
        setActiveSale(activeSales[0]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching flash sales:", error);
        setLoading(false);
      }
    };
    
    fetchActiveSales();
  }, []);

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(activeSale.endDate);
      const diff = endDate - now;

      if (diff <= 0) {
        setActiveSale(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Calculate immediately and then set interval
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeSale]);

  // Don't render anything if loading or no active sale
  if (loading || !activeSale) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-lg shadow-lg"
    >
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 md:p-8">
        {activeSale.imageUrl && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={activeSale.imageUrl} 
              alt={activeSale.title || 'Flash Sale'} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <div className="inline-flex items-center bg-white bg-opacity-20 px-3 py-1 rounded-full text-white text-sm font-semibold mb-3">
              <FiTag className="mr-1" /> Flash Sale
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {activeSale.title || 'Special Offer'}
            </h3>
            <p className="text-white text-opacity-90 mb-4 max-w-xl">
              {activeSale.description || 'Limited time offer with special discounts'}
            </p>
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 font-medium rounded-md hover:bg-opacity-90 transition-colors"
            >
              Shop Now <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-white mb-2">
              <FiClock className="mr-2" />
              <span className="font-semibold">Ends in:</span>
            </div>
            <div className="flex space-x-2 md:space-x-4">
              <div className="flex flex-col items-center">
                <div className="bg-white text-indigo-600 rounded-lg w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl font-bold">
                  {timeRemaining.days}
                </div>
                <span className="text-xs md:text-sm text-white mt-1">Days</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-indigo-600 rounded-lg w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl font-bold">
                  {timeRemaining.hours}
                </div>
                <span className="text-xs md:text-sm text-white mt-1">Hours</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-indigo-600 rounded-lg w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl font-bold">
                  {timeRemaining.minutes}
                </div>
                <span className="text-xs md:text-sm text-white mt-1">Mins</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-indigo-600 rounded-lg w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl font-bold">
                  {timeRemaining.seconds}
                </div>
                <span className="text-xs md:text-sm text-white mt-1">Secs</span>
              </div>
            </div>
            <div className="mt-4 text-white text-xl md:text-2xl font-bold">
              {(activeSale.discountPercentage || 0)}% OFF
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FlashSalesBanner; 