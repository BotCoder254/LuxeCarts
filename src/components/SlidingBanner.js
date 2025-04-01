import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const defaultImages = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    title: 'Luxury Shopping Experience',
    description: 'Discover premium products curated just for you',
    transitionDuration: 0.5
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1549989476-69a92fa57c36',
    title: 'Exclusive Collections',
    description: 'Browse through our handpicked selections',
    transitionDuration: 0.5
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b',
    title: 'Fashion Forward',
    description: 'Stay ahead with the latest trends',
    transitionDuration: 0.5
  }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const SlidingBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState(defaultImages);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const bannerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        transitionDuration: doc.data().transitionDuration || 0.5
      }));
      
      if (bannerData.length > 0) {
        setImages(bannerData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [images.length, isHovered]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (loading) {
    return <div className="w-full h-full bg-gray-100 animate-pulse"></div>;
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            duration: images[currentIndex]?.transitionDuration || 0.5
          }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent">
            <div className="absolute bottom-20 left-10 text-white max-w-xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold mb-4"
              >
                {images[currentIndex].title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl"
              >
                {images[currentIndex].description}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200"
      >
        <FiChevronLeft className="w-6 h-6 text-white" />
      </motion.button>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all duration-200"
      >
        <FiChevronRight className="w-6 h-6 text-white" />
      </motion.button>

      {/* Navigation Dots */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SlidingBanner; 
