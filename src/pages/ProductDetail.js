import React, { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import { db } from '../firebase/config';

import { addToCart } from '../store/slices/cartSlice';

import { fetchPricingRules } from '../store/slices/pricingSlice';

import { FiShoppingCart, FiHeart, FiShare2, FiTruck, FiShield, FiPackage, FiTag, FiClock, FiMapPin } from 'react-icons/fi';

import { ThreeDots } from 'react-loader-spinner';

import { motion } from 'framer-motion';

import toast from 'react-hot-toast';

const ProductDetail = () => {

  const { id } = useParams();

  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);

  const { rules } = useSelector((state) => state.pricing);

  const [selectedImage, setSelectedImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState('');

  const [selectedColor, setSelectedColor] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [isInWishlist, setIsInWishlist] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState([]);

  const [hasRated, setHasRated] = useState(false);

  const [userRating, setUserRating] = useState(0);

  const [userLocation, setUserLocation] = useState(null);

  const { user } = useSelector((state) => state.auth);

  const [discountedPrice, setDiscountedPrice] = useState(0);

  const [activeRules, setActiveRules] = useState([]);

  const features = [

    {

      icon: <FiTruck className="w-6 h-6" />,

      title: 'Free Shipping',

      description: 'On orders over $100',

    },

    {

      icon: <FiShield className="w-6 h-6" />,

      title: 'Secure Payment',

      description: '100% secure payment',

    },

    {

      icon: <FiPackage className="w-6 h-6" />,

      title: 'Easy Returns',

      description: '30 days return policy',

    },

  ];

  useEffect(() => {

    const fetchProduct = async () => {

      try {

        const docRef = doc(db, 'products', id);

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

          const productData = { id: docSnap.id, ...docSnap.data() };

          setProduct(productData);

          fetchRelatedProducts(productData.category);

        }

      } catch (error) {

        toast.error('Error loading product');

      } finally {

        setLoading(false);

      }

    };

    fetchProduct();

  }, [id]);

  const fetchRelatedProducts = async (category) => {

    try {

      const q = query(

        collection(db, 'products'),

        where('category', '==', category)

      );

      const querySnapshot = await getDocs(q);

      const products = querySnapshot.docs

        .map(doc => ({ id: doc.id, ...doc.data() }))

        .filter(p => p.id !== id)

        .slice(0, 4);

      setRelatedProducts(products);

    } catch (error) {

      console.error('Error fetching related products:', error);

    }

  };

  useEffect(() => {
    // Fetch pricing rules when component mounts
    dispatch(fetchPricingRules());
  }, [dispatch]);

  useEffect(() => {
    // Get user location for location-based pricing
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
            const data = await response.json();
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              region: data.principalSubdivision // State/Region name
            });
          } catch (error) {
            console.error('Error getting location details:', error);
          }
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  useEffect(() => {
    if (product && rules) {
      let finalPrice = product.price;
      const currentRules = [];

      rules.forEach(rule => {
        if (!rule.isActive) return;

        // Check time-limited sales
        if (rule.type === 'sale') {
          const now = new Date();
          const start = rule.startDate ? new Date(rule.startDate) : null;
          const end = rule.endDate ? new Date(rule.endDate) : null;

          if ((!start || now >= start) && (!end || now <= end)) {
            const discount = rule.discountType === 'percentage' 
              ? finalPrice * (rule.discountValue / 100)
              : rule.discountValue;
            finalPrice -= discount;
            currentRules.push(rule);
          }
        }

        // Check bulk discounts
        if (rule.type === 'bulk' && quantity >= rule.minQuantity) {
          const discount = rule.discountType === 'percentage'
            ? finalPrice * (rule.discountValue / 100)
            : rule.discountValue;
          finalPrice -= discount;
          currentRules.push(rule);
        }

        // Check location-based pricing
        if (rule.type === 'location' && userLocation?.region && rule.regions?.includes(userLocation.region)) {
          const adjustment = rule.adjustmentType === 'percentage'
            ? finalPrice * (rule.adjustmentValue / 100)
            : rule.adjustmentValue;
          finalPrice += adjustment;
          currentRules.push(rule);
        }
      });

      setDiscountedPrice(Math.max(0, finalPrice));
      setActiveRules(currentRules);
    } else {
      // If no product or rules, set discounted price to product price
      setDiscountedPrice(product?.price || 0);
      setActiveRules([]);
    }
  }, [product, rules, quantity, userLocation]);

  const handleAddToCart = () => {

    if (!selectedSize && product.sizes?.length > 0) {

      toast.error('Please select a size');

      return;

    }

    if (!selectedColor && product.colors?.length > 0) {

      toast.error('Please select a color');

      return;

    }

    dispatch(addToCart({

      ...product,

      quantity,

      selectedSize,

      selectedColor,

    }));

    toast.success('Added to cart!');

  };

  const handleWishlist = async () => {

    if (!user) {

      toast.error('Please login to add items to wishlist');

      return;

    }

    try {

      const userRef = doc(db, 'users', user.uid);

      const productRef = doc(db, 'products', id);

      if (isInWishlist) {

        await updateDoc(userRef, {

          wishlist: arrayRemove(id)

        });

        setIsInWishlist(false);

        toast.success('Removed from wishlist');

      } else {

        await updateDoc(userRef, {

          wishlist: arrayUnion(id)

        });

        setIsInWishlist(true);

        toast.success('Added to wishlist');

      }

    } catch (error) {

      console.error('Error updating wishlist:', error);

      toast.error('Failed to update wishlist');

    }

  };

  const handleRating = async (rating) => {

    if (!user) {

      toast.error('Please login to rate this product');

      return;

    }

    if (hasRated) {

      toast.error('You have already rated this product');

      return;

    }

    try {

      const productRef = doc(db, 'products', id);

      const currentRating = product.rating || 0;

      const totalRatings = product.totalRatings || 0;

      const newRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);

      await updateDoc(productRef, {

        rating: newRating,

        totalRatings: totalRatings + 1,

        [`ratings.${user.uid}`]: rating

      });

      setUserRating(rating);

      setHasRated(true);

      toast.success('Thank you for rating!');

    } catch (error) {

      console.error('Error updating rating:', error);

      toast.error('Failed to update rating');

    }

  };

  useEffect(() => {

    const checkUserInteractions = async () => {

      if (user && product) {

        // Check wishlist

        const userRef = doc(db, 'users', user.uid);

        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {

          const wishlist = userDoc.data().wishlist || [];

          setIsInWishlist(wishlist.includes(id));

        }

        // Check if user has rated

        if (product.ratings && product.ratings[user.uid]) {

          setHasRated(true);

          setUserRating(product.ratings[user.uid]);

        }

      }

    };

    checkUserInteractions();

  }, [user, product, id]);

  if (loading) {

    return (

      <div className="flex justify-center items-center h-screen">

        <ThreeDots color="#4F46E5" height={80} width={80} />

      </div>

    );

  }

  if (!product) {

    return (

      <div className="container mx-auto px-4 py-8">

        <p className="text-center text-xl text-gray-600">Product not found</p>

      </div>

    );

  }

  return (

    <div className="bg-white">

      <div className="max-w-7xl mx-auto pt-20 pb-8 px-4 sm:px-6 lg:px-8">

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">

          {/* Product Images */}

          <div className="mb-8 lg:mb-0">

            <motion.div

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              className="relative"

            >

              <img

                src={product.images?.[selectedImage] || product.image}

                alt={product.name}

                className="w-full h-96 object-cover rounded-lg"

              />

              <button

                onClick={handleWishlist}

                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"

              >

                <FiHeart 

                  className={`w-6 h-6 ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'}`}

                />

              </button>

            </motion.div>

            {product.images && product.images.length > 1 && (

              <div className="mt-4 grid grid-cols-4 gap-4">

                {product.images.map((image, index) => (

                  <button

                    key={index}

                    onClick={() => setSelectedImage(index)}

                    className={`relative rounded-lg overflow-hidden ${

                      selectedImage === index

                        ? 'ring-2 ring-indigo-500'

                        : 'ring-1 ring-gray-200'

                    }`}

                  >

                    <img

                      src={image}

                      alt={`Product ${index + 1}`}

                      className="w-full h-24 object-cover"

                    />

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* Product Info */}

          <div className="lg:pl-8">

            <div className="mb-8">

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              <div className="flex items-center mb-4">

                <div className="flex items-center">

                  {[...Array(5)].map((_, index) => (

                    <button

                      key={index}

                      onClick={() => !hasRated && handleRating(index + 1)}

                      className={`w-5 h-5 ${hasRated ? 'cursor-not-allowed' : 'cursor-pointer'}`}

                      disabled={hasRated}

                    >

                      <svg

                        className={`w-5 h-5 ${

                          index < (userRating || product.rating || 0)

                            ? 'text-yellow-400'

                            : 'text-gray-300'

                        } ${!hasRated && 'hover:text-yellow-400'}`}

                        fill="currentColor"

                        viewBox="0 0 20 20"

                      >

                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />

                      </svg>

                    </button>

                  ))}

                </div>

                <span className="ml-2 text-gray-600">

                  {hasRated ? 'Thank you for rating!' : `${product.reviews?.length || 0} reviews`}

                </span>

              </div>

              <div className="flex flex-col space-y-4 mt-6">
                {/* Price display with discounts */}
                <div className="mt-4">
                  {discountedPrice < product.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-gray-900">${discountedPrice.toFixed(2)}</span>
                      <span className="text-xl text-gray-500 line-through">${product.price.toFixed(2)}</span>
                      <span className="text-sm text-green-600">
                        {((1 - discountedPrice / product.price) * 100).toFixed(0)}% OFF
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  )}
                  {activeRules.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {activeRules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                          {rule.type === 'bulk' && <FiTag className="w-4 h-4" />}
                          {rule.type === 'sale' && <FiClock className="w-4 h-4" />}
                          {rule.type === 'location' && <FiMapPin className="w-4 h-4" />}
                          <span>{rule.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-6">{product.description}</p>

                {/* Size Selector */}

                {product.sizes && product.sizes.length > 0 && (

                  <div className="mb-6">

                    <h3 className="text-sm font-medium text-gray-900 mb-4">Size</h3>

                    <div className="grid grid-cols-4 gap-2">

                      {product.sizes.map((size) => (

                        <button

                          key={size}

                          onClick={() => setSelectedSize(size)}

                          className={`py-2 text-sm font-medium rounded-md ${

                            selectedSize === size

                              ? 'bg-indigo-600 text-white'

                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'

                          }`}

                        >

                          {size}

                        </button>

                      ))}

                    </div>

                  </div>

                )}

                {/* Color Selector */}

                {product.colors && product.colors.length > 0 && (

                  <div className="mb-6">

                    <h3 className="text-sm font-medium text-gray-900 mb-4">Color</h3>

                    <div className="flex space-x-2">

                      {product.colors.map((color) => (

                        <button

                          key={color}

                          onClick={() => setSelectedColor(color)}

                          className={`w-8 h-8 rounded-full border-2 ${

                            selectedColor === color

                              ? 'border-indigo-600'

                              : 'border-gray-300'

                          }`}

                          style={{ backgroundColor: color }}

                        />

                      ))}

                    </div>

                  </div>

                )}

                {/* Quantity Selector */}

                <div className="mb-6">

                  <h3 className="text-sm font-medium text-gray-900 mb-4">Quantity</h3>

                  <select

                    value={quantity}

                    onChange={(e) => setQuantity(Number(e.target.value))}

                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"

                  >

                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (

                      <option key={num} value={num}>

                        {num}

                      </option>

                    ))}

                  </select>

                </div>

                {/* Add to Cart Button */}

                <button

                  onClick={handleAddToCart}

                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"

                >

                  <FiShoppingCart className="w-5 h-5" />

                  <span>Add to Cart</span>

                </button>

                {/* Share Button */}

                <button

                  onClick={() => {

                    navigator.clipboard.writeText(window.location.href);

                    toast.success('Link copied to clipboard!');

                  }}

                  className="mt-4 w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"

                >

                  <FiShare2 className="w-5 h-5" />

                  <span>Share Product</span>

                </button>

              </div>

            </div>

            {/* Product Features */}

            <div className="border-t border-gray-200 pt-6">

              <div className="grid grid-cols-3 gap-6">

                {features.map((feature) => (

                  <div key={feature.title} className="text-center">

                    <div className="flex justify-center mb-2 text-indigo-600">

                      {feature.icon}

                    </div>

                    <h4 className="text-sm font-medium text-gray-900">

                      {feature.title}

                    </h4>

                    <p className="mt-1 text-xs text-gray-500">

                      {feature.description}

                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/product/${relatedProduct.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="relative aspect-w-1 aspect-h-1">
                      <img
                        src={relatedProduct.images?.[0] || relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                      {relatedProduct.discounts?.sale?.enabled && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                          Sale
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                        {relatedProduct.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex flex-col">
                          {relatedProduct.finalPrice && relatedProduct.finalPrice < relatedProduct.price ? (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                ${relatedProduct.price.toFixed(2)}
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                ${relatedProduct.finalPrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${relatedProduct.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {relatedProduct.rating > 0 && (
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, index) => (
                                <svg
                                  key={index}
                                  className={`w-4 h-4 ${
                                    index < Math.floor(relatedProduct.rating)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-1 text-sm text-gray-500">
                              ({relatedProduct.totalRatings || 0})
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Additional product info */}
                      <div className="mt-2 space-y-1">
                        {relatedProduct.stock <= relatedProduct.stockThreshold ? (
                          <p className="text-xs text-red-600">Low Stock</p>
                        ) : (
                          <p className="text-xs text-green-600">In Stock</p>
                        )}
                        {relatedProduct.features?.length > 0 && (
                          <p className="text-xs text-gray-500 truncate">
                            {relatedProduct.features[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>

  );

};

export default ProductDetail;
