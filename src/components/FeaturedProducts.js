import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductCard from './ProductCard';
import { ThreeDots } from 'react-loader-spinner';
import toast from 'react-hot-toast';

const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'active'),
          limit(4)
        );

        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            name: data.name || 'Untitled Product',
            description: data.description || '',
            price: parseFloat(data.price) || 0,
            stock: parseInt(data.stock) || 0,
            stockThreshold: parseInt(data.stockThreshold) || 5,
            image: data.image || data.images?.[0] || '',
            images: data.images || [],
            discount: data.discount ? parseFloat(data.discount) : null,
            discounts: {
              sale: data.discounts?.sale ? {
                ...data.discounts.sale,
                enabled: Boolean(data.discounts.sale.enabled),
                discountValue: parseFloat(data.discounts.sale.discountValue) || 0,
                discountType: data.discounts.sale.discountType || 'percentage',
                startDate: data.discounts.sale.startDate || null,
                endDate: data.discounts.sale.endDate || null
              } : {
                enabled: false,
                discountValue: 0,
                discountType: 'percentage'
              },
              bulk: data.discounts?.bulk ? {
                ...data.discounts.bulk,
                enabled: Boolean(data.discounts.bulk.enabled),
                discountValue: parseFloat(data.discounts.bulk.discountValue) || 0,
                discountType: data.discounts.bulk.discountType || 'percentage',
                minQuantity: parseInt(data.discounts.bulk.minQuantity) || 1
              } : {
                enabled: false,
                discountValue: 0,
                discountType: 'percentage',
                minQuantity: 1
              }
            },
            features: Array.isArray(data.features) ? data.features : [],
            onSale: Boolean(data.onSale),
            category: data.category || 'Uncategorized'
          };
        });
        setFeaturedProducts(products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handlePreviewClick = (e) => {
    if (isPreview) {
      e.preventDefault();
      toast.info('This is a preview. Interactive features are disabled.');
    }
  };

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900">
            Featured Products
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Discover our latest and most popular items
          </p>
          <Link
            to={isPreview ? '#' : '/products'}
            className={`mt-4 inline-flex items-center text-indigo-600 ${isPreview ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-800'}`}
            onClick={handlePreviewClick}
          >
            View All Products <FiArrowRight className="ml-2" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex justify-center">
            <ThreeDots color="#4F46E5" height={50} width={50} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} view="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts; 