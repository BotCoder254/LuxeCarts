import React, { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '../firebase/config';

import { addToCart } from '../store/slices/cartSlice';

import { FiShoppingCart, FiHeart, FiShare2, FiTruck, FiShield, FiPackage } from 'react-icons/fi';

import { ThreeDots } from 'react-loader-spinner';

import { motion } from 'framer-motion';

import toast from 'react-hot-toast';



const ProductDetail = () => {

  const { id } = useParams();

  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [selectedSize, setSelectedSize] = useState('');

  const [selectedColor, setSelectedColor] = useState('');

  const [relatedProducts, setRelatedProducts] = useState([]);



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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

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

                onClick={() => {}} // Implement wishlist functionality

                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"

              >

                <FiHeart className="w-6 h-6 text-gray-600" />

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

                    <svg

                      key={index}

                      className={`w-5 h-5 ${

                        index < (product.rating || 0)

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

                <span className="ml-2 text-gray-600">

                  {product.reviews?.length || 0} reviews

                </span>

              </div>

              <p className="text-3xl font-bold text-gray-900 mb-6">

                ${product.price.toFixed(2)}

                {product.oldPrice && (

                  <span className="ml-2 text-lg text-gray-500 line-through">

                    ${product.oldPrice.toFixed(2)}

                  </span>

                )}

              </p>

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



        {/* Related Products */}

        {relatedProducts.length > 0 && (

          <div className="mt-16">

            <h2 className="text-2xl font-bold text-gray-900 mb-6">

              Related Products

            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {relatedProducts.map((relatedProduct) => (

                <Link

                  key={relatedProduct.id}

                  to={`/product/${relatedProduct.id}`}

                  className="group"

                >

                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">

                    <img

                      src={relatedProduct.image}

                      alt={relatedProduct.name}

                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"

                    />

                    <div className="p-4">

                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">

                        {relatedProduct.name}

                      </h3>

                      <p className="mt-1 text-gray-900 font-medium">

                        ${relatedProduct.price.toFixed(2)}

                      </p>

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
