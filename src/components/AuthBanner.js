import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthBanner = ({ defaultImage }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bannersQuery = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(bannersQuery, (snapshot) => {
      const bannerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBanners(bannerData.length > 0 ? bannerData : [{ url: defaultImage }]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [defaultImage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-l-xl"></div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-l-xl">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={banners[currentIndex]?.url}
          alt="Authentication"
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
    </div>
  );
};

export default AuthBanner; 