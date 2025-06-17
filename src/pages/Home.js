import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { FiShoppingBag, FiTruck, FiCreditCard, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import FeaturedProducts from '../components/FeaturedProducts';
import SlidingBanner from '../components/SlidingBanner';
import FlashSalesBanner from '../components/FlashSalesBanner';
import BlogPreview from '../components/BlogPreview';
import { toast } from 'react-hot-toast';

const features = [
  {
    icon: <FiShoppingBag />,
    title: 'Premium Selection',
    description: 'Curated collection of high-quality products',
  },
  {
    icon: <FiTruck />,
    title: 'Fast Delivery',
    description: 'Quick and reliable worldwide shipping',
  },
  {
    icon: <FiCreditCard />,
    title: 'Secure Payment',
    description: 'Safe and encrypted payment methods',
  },
  {
    icon: <FiShield />,
    title: '24/7 Support',
    description: 'Round-the-clock customer assistance',
  },
  {
    icon: <FiShield />,
    title: 'Money-Back Guarantee',
    description: '30-day return policy for your peace of mind',
  },
  {
    icon: <FiShoppingBag />,
    title: 'Exclusive Deals',
    description: 'Special offers and discounts for members',
  },
];

const categories = [
  {
    name: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3',
    link: '/products?category=electronics',
    description: 'Latest gadgets and tech accessories'
  },
  {
    name: 'Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3',
    link: '/products?category=fashion',
    description: 'Trendy clothing and accessories'
  },
  {
    name: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?ixlib=rb-4.0.3',
    link: '/products?category=home',
    description: 'Beautiful home decor and furniture'
  },
  {
    name: 'Beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3',
    link: '/products?category=beauty',
    description: 'Premium beauty and skincare'
  },
  {
    name: 'Sports',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3',
    link: '/products?category=sports',
    description: 'Sports equipment and activewear'
  },
  {
    name: 'Jewelry',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3',
    link: '/products?category=jewelry',
    description: 'Fine jewelry and watches'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    content: "Amazing quality products and excellent customer service. Will definitely shop here again!",
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Regular Customer',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    content: "The best online shopping experience I've had. Fast delivery and great prices.",
    rating: 5
  },
  {
    name: 'Emma Wilson',
    role: 'Premium Member',
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
    content: "LuxeCart's premium selection is unmatched. The quality of products exceeds expectations.",
    rating: 5
  },
  {
    name: 'David Thompson',
    role: 'Fashion Enthusiast',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    content: "Found amazing designer pieces at great prices. The customer service is exceptional!",
    rating: 5
  }
];

const Home = () => {
  // Get preview mode from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get('preview') === 'true';

  // Disable interactive elements in preview mode
  const handlePreviewClick = (e) => {
    if (isPreview) {
      e.preventDefault();
      e.stopPropagation();
      toast.info('This is a preview. Interactive features are disabled.');
    }
  };

  // Prevent navigation in preview mode
  useEffect(() => {
    if (isPreview) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isPreview]);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-900 to-blue-900 h-[85vh]">
        {isPreview && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
            Preview Mode - Interactive features are disabled
          </div>
        )}
        <div className="absolute inset-0">
          <SlidingBanner />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center w-full"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 drop-shadow-lg">
              Discover Luxury at
              <span className="text-indigo-300"> LuxeCart</span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-white max-w-3xl mx-auto drop-shadow-lg">
              Your premier destination for premium products and exceptional shopping experience.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/products"
                className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 ${isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105'} shadow-lg`}
                onClick={handlePreviewClick}
              >
                Shop Now <FiArrowRight className="ml-2" />
              </Link>
              <Link
                to="/register"
                className={`inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-md text-white ${isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-indigo-900 transition-all duration-200 transform hover:scale-105'} shadow-lg`}
                onClick={handlePreviewClick}
              >
                Join Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Flash Sales Section */}
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FlashSalesBanner />
      </div>

      {/* Featured Products Section */}
      <div className="py-16">
        <FeaturedProducts />
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose LuxeCart?
            </h2>
            <p className="text-xl text-gray-600">
              Experience shopping with confidence and convenience
            </p>
          </motion.div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative group"
                >
                  <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-24 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Shop by Category
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group overflow-hidden rounded-lg shadow-lg"
              >
                <Link to={category.link}>
                  <div className="relative h-80">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {category.name}
                      </h3>
                      <p className="text-white mt-2 drop-shadow-lg opacity-90">
                        {category.description}
                      </p>
                      <p className="text-white mt-2 drop-shadow-lg">
                        Explore Collection →
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Section */}
      <BlogPreview />

      {/* Testimonials Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Don't just take our word for it, hear from our satisfied customers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-14 w-14 rounded-full border-4 border-indigo-50"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-indigo-600 font-medium">{testimonial.role}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed">"{testimonial.content}"</p>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-sm text-gray-500">Verified Purchase</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="relative bg-indigo-700 overflow-hidden w-full">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:py-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center"
          >
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Stay in the Loop
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                Subscribe to our newsletter and be the first to know about:
              </p>
              <ul className="mt-8 space-y-3">
                {['Exclusive Deals & Discounts', 'New Product Launches', 'Seasonal Collections', 'Special Events'].map((item) => (
                  <li key={item} className="flex items-center text-indigo-100">
                    <svg className="h-6 w-6 text-indigo-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-10">
                <form className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white">
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        type="email"
                        id="email"
                        className="block w-full rounded-md border-0 bg-white/5 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 placeholder:text-gray-300"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-700 transition-colors duration-200"
                    >
                      Subscribe Now
                    </button>
                  </div>
                </form>
                <p className="mt-4 text-sm text-indigo-100 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FiShoppingBag className="h-8 w-8 text-indigo-500" />
                <span className="text-2xl font-bold">LuxeCart</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your premier destination for luxury shopping. Discover premium products with exceptional quality.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Links */}
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Home', 'Products', 'Categories', 'About Us', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2">
                {[
                  'Shipping Policy',
                  'Returns & Exchanges',
                  'FAQ',
                  'Track Order',
                  'Privacy Policy',
                ].map((item) => (
                  <li key={item}>
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start space-x-3">
                  <svg className="h-6 w-6 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>123 Shopping Street, NY 10001, USA</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@luxecart.com</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="h-6 w-6 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+1 (555) 123-4567</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} LuxeCart. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 