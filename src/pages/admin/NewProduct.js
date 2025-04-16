import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FiArrowLeft, FiUpload, FiX, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { inputStyles } from '../../styles/commonStyles';

const NewProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    barcode: '',
    stock: '',
    stockThreshold: '5',
    status: 'active',
    condition: 'new',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    tags: [],
    features: [],
    specifications: {},
    variants: [],
    images: [],
    sizes: [],
    colors: [],
    materials: [],
    featured: false,
    onSale: false,
    salePrice: '',
    saleStartDate: '',
    saleEndDate: '',
    discounts: {
      bulk: {
        enabled: false,
        minQuantity: '',
        discountType: 'percentage',
        discountValue: '',
      },
      sale: {
        enabled: false,
        discountType: 'percentage',
        discountValue: '',
        startDate: '',
        endDate: '',
      },
      location: {
        enabled: false,
        regions: [],
        adjustmentType: 'percentage',
        adjustmentValue: '',
      }
    },
    shippingClass: 'standard',
    taxClass: 'standard',
    metaTitle: '',
    metaDescription: '',
    warrantyInfo: '',
    returnPolicy: '',
  });

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Living',
    'Beauty',
    'Sports',
    'Books',
    'Toys',
    'Automotive',
    'Health',
    'Garden',
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' },
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'discontinued', label: 'Discontinued' },
    { value: 'coming_soon', label: 'Coming Soon' },
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ''],
    });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim().toLowerCase());
    setFormData({ ...formData, tags });
  };

  const handleSizeChange = (e) => {
    const sizes = e.target.value.split(',').map(size => size.trim());
    setFormData({ ...formData, sizes });
  };

  const handleColorChange = (e) => {
    const colors = e.target.value.split(',').map(color => color.trim());
    setFormData({ ...formData, colors });
  };

  const handleSpecificationChange = (key, value) => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [key]: value,
      },
    });
  };

  const addSpecification = () => {
    const newKey = `spec_${Object.keys(formData.specifications).length + 1}`;
    handleSpecificationChange(newKey, '');
  };

  const removeSpecification = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const handleDiscountChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [type]: {
          ...prev.discounts[type],
          [field]: value
        }
      }
    }));
  };

  const calculateFinalPrice = () => {
    let finalPrice = parseFloat(formData.price) || 0;
    const discounts = formData.discounts;

    if (discounts.sale.enabled) {
      const discount = discounts.sale.discountType === 'percentage'
        ? finalPrice * (parseFloat(discounts.sale.discountValue) / 100)
        : parseFloat(discounts.sale.discountValue);
      finalPrice -= discount;
    }

    if (discounts.bulk.enabled) {
      const discount = discounts.bulk.discountType === 'percentage'
        ? finalPrice * (parseFloat(discounts.bulk.discountValue) / 100)
        : parseFloat(discounts.bulk.discountValue);
      finalPrice = Math.max(0, finalPrice - discount);
    }

    return Math.max(0, finalPrice);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrls = [];

      // Upload images
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const finalPrice = calculateFinalPrice();
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        finalPrice,
        stock: parseInt(formData.stock),
        stockThreshold: parseInt(formData.stockThreshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: imageUrls,
        discounts: {
          ...formData.discounts,
          sale: {
            ...formData.discounts.sale,
            startDate: formData.discounts.sale.startDate ? new Date(formData.discounts.sale.startDate).toISOString() : null,
            endDate: formData.discounts.sale.endDate ? new Date(formData.discounts.sale.endDate).toISOString() : null,
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'products'), productData);
      toast.success('Product added successfully!');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-2" /> Back to Products
          </button>
          <h1 className="ml-4 text-2xl font-bold text-gray-900">
            Add New Product
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label className={inputStyles.label}>Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputStyles.base}
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div>
              <label className={inputStyles.label}>Description</label>
              <textarea
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputStyles.textarea}
                placeholder="Enter product description"
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={inputStyles.label}>Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="pl-8 w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className={inputStyles.label}>Stock</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className={inputStyles.base}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {imagePreview.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sizes (comma-separated)</label>
                <input
                  type="text"
                  value={formData.sizes.join(', ')}
                  onChange={handleSizeChange}
                  placeholder="S, M, L, XL"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Colors (comma-separated)</label>
                <input
                  type="text"
                  value={formData.colors.join(', ')}
                  onChange={handleColorChange}
                  placeholder="Red, Blue, Green"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Features</label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter a feature"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <FiX />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <FiPlus className="mr-1" /> Add Feature
            </button>
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div key={key} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newSpecs = { ...formData.specifications };
                    delete newSpecs[key];
                    handleSpecificationChange(e.target.value, value);
                  }}
                  placeholder="Specification name"
                  className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleSpecificationChange(key, e.target.value)}
                  placeholder="Specification value"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeSpecification(key)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <FiX />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSpecification}
              className="mt-2 flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <FiPlus className="mr-1" /> Add Specification
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g., wireless, bluetooth, electronics"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Featured Product
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.onSale}
                onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                On Sale
              </label>
            </div>
          </div>

          {/* Pricing and Discounts Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Pricing & Discounts</h3>
            
            {/* Regular Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={inputStyles.label}>Regular Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="pl-8 w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className={inputStyles.label}>Compare at Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="pl-8 w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Sale Discount */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.discounts.sale.enabled}
                  onChange={(e) => handleDiscountChange('sale', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Enable Sale Discount</label>
              </div>

              {formData.discounts.sale.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={inputStyles.label}>Discount Type</label>
                    <select
                      value={formData.discounts.sale.discountType}
                      onChange={(e) => handleDiscountChange('sale', 'discountType', e.target.value)}
                      className={inputStyles.base}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className={inputStyles.label}>
                      {formData.discounts.sale.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                    </label>
                    <div className="relative">
                      {formData.discounts.sale.discountType === 'fixed' && (
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      )}
                      <input
                        type="number"
                        step={formData.discounts.sale.discountType === 'percentage' ? '1' : '0.01'}
                        value={formData.discounts.sale.discountValue}
                        onChange={(e) => handleDiscountChange('sale', 'discountValue', e.target.value)}
                        className={`${formData.discounts.sale.discountType === 'fixed' ? 'pl-8' : ''} w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formData.discounts.sale.discountType === 'percentage' && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={inputStyles.label}>Sale Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.discounts.sale.startDate}
                      onChange={(e) => handleDiscountChange('sale', 'startDate', e.target.value)}
                      className={inputStyles.base}
                    />
                  </div>
                  <div>
                    <label className={inputStyles.label}>Sale End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.discounts.sale.endDate}
                      onChange={(e) => handleDiscountChange('sale', 'endDate', e.target.value)}
                      className={inputStyles.base}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Discount */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.discounts.bulk.enabled}
                  onChange={(e) => handleDiscountChange('bulk', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Enable Bulk Discount</label>
              </div>

              {formData.discounts.bulk.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={inputStyles.label}>Minimum Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.discounts.bulk.minQuantity}
                      onChange={(e) => handleDiscountChange('bulk', 'minQuantity', e.target.value)}
                      className={inputStyles.base}
                    />
                  </div>
                  <div>
                    <label className={inputStyles.label}>Discount Type</label>
                    <select
                      value={formData.discounts.bulk.discountType}
                      onChange={(e) => handleDiscountChange('bulk', 'discountType', e.target.value)}
                      className={inputStyles.base}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className={inputStyles.label}>
                      {formData.discounts.bulk.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                    </label>
                    <div className="relative">
                      {formData.discounts.bulk.discountType === 'fixed' && (
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      )}
                      <input
                        type="number"
                        step={formData.discounts.bulk.discountType === 'percentage' ? '1' : '0.01'}
                        value={formData.discounts.bulk.discountValue}
                        onChange={(e) => handleDiscountChange('bulk', 'discountValue', e.target.value)}
                        className={`${formData.discounts.bulk.discountType === 'fixed' ? 'pl-8' : ''} w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formData.discounts.bulk.discountType === 'percentage' && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Final Price Preview */}
            {(formData.discounts.sale.enabled || formData.discounts.bulk.enabled) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Final Price Preview:</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${calculateFinalPrice().toFixed(2)}
                  {formData.price && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      ${parseFloat(formData.price).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewProduct; 