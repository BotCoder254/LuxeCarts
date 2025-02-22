import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FiEdit2, FiTrash2, FiPlus, FiImage, FiX, FiShoppingBag } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    product || {
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      inStock: true,
      status: 'active',
      images: [],
      sizes: [],
      colors: [],
      featured: false,
      discount: '',
      tags: [],
      brand: '',
      specifications: {},
    }
  );
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const handleSizeChange = (e) => {
    const sizes = e.target.value.split(',').map(size => size.trim());
    setFormData({ ...formData, sizes });
  };

  const handleColorChange = (e) => {
    const colors = e.target.value.split(',').map(color => color.trim());
    setFormData({ ...formData, colors });
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim().toLowerCase());
    setFormData({ ...formData, tags });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      let imageUrls = [...(formData.images || [])];

      // Upload new images
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discount: formData.discount ? parseFloat(formData.discount) : null,
        images: imageUrls,
        updatedAt: serverTimestamp(),
      };

      await onSubmit(productData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock</label>
          <input
            type="number"
            required
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FiImage className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload files</span>
                  <input
                    type="file"
                    multiple
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

        <div className="col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600">Featured Product</span>
          </label>
        </div>
      </div>

      <div className="col-span-2">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Stock Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="e.g., wireless, bluetooth, electronics"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Brand</label>
        <input
          type="text"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specifications
        </label>
        <div className="space-y-2">
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newSpecs = { ...formData.specifications };
                  delete newSpecs[key];
                  handleSpecificationChange(e.target.value, value);
                }}
                placeholder="Key"
                className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleSpecificationChange(key, e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  const newSpecs = { ...formData.specifications };
                  delete newSpecs[key];
                  setFormData({ ...formData, specifications: newSpecs });
                }}
                className="text-red-600 hover:text-red-800"
              >
                <FiX />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleSpecificationChange(`spec_${Object.keys(formData.specifications).length + 1}`, '')}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            + Add Specification
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    brand: '',
    minStock: '',
    maxStock: '',
    minPrice: '',
    maxPrice: '',
    tags: [],
  });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Delete product images from storage first
        const product = products.find(p => p.id === productId);
        if (product.images) {
          for (const imageUrl of product.images) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          }
        }

        // Delete product document
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Product deleted successfully');
        fetchProducts(); // Refresh the list
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error deleting product');
      }
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: parseInt(newStock),
        status: parseInt(newStock) > 0 ? 'active' : 'out_of_stock',
        updatedAt: serverTimestamp(),
      });
      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error updating stock');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesStatus = !advancedFilters.status || product.status === advancedFilters.status;
    const matchesStock = (!advancedFilters.minStock || product.stock >= Number(advancedFilters.minStock)) &&
      (!advancedFilters.maxStock || product.stock <= Number(advancedFilters.maxStock));
    const matchesPrice = (!advancedFilters.minPrice || product.price >= Number(advancedFilters.minPrice)) &&
      (!advancedFilters.maxPrice || product.price <= Number(advancedFilters.maxPrice));

    return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesPrice;
  });

  const handleAddProduct = async (productData) => {
    try {
      // Check if product with same name already exists
      const q = query(
        collection(db, 'products'),
        where('name', '==', productData.name)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error('A product with this name already exists');
        return;
      }

      // Add new product with proper timestamps
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: productData.stock > 0 ? 'active' : 'out_of_stock',
      });

      toast.success('Product added successfully');
      fetchProducts();
      return docRef;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product');
      throw error;
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      const productRef = doc(db, 'products', productId);
      
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp(),
        status: productData.stock > 0 ? 'active' : 'out_of_stock',
      });

      toast.success('Product updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error updating product');
      throw error;
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const productRef = doc(db, 'products', productId);
      
      await updateDoc(productRef, {
        stock: parseInt(newStock),
        status: parseInt(newStock) > 0 ? 'active' : 'out_of_stock',
        updatedAt: serverTimestamp(),
      });

      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error updating stock');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" />
            Add Product
          </button>
          <Link
            to="/?preview=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={(e) => {
              e.preventDefault();
              const previewUrl = window.location.origin + '/?preview=true';
              window.open(previewUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
            View Store
          </Link>
        </div>
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <ProductForm
              product={selectedProduct}
              onSubmit={async (productData) => {
                if (selectedProduct) {
                  await handleUpdateProduct(selectedProduct.id, productData);
                } else {
                  await handleAddProduct(productData);
                }
                setShowProductForm(false);
              }}
              onCancel={() => setShowProductForm(false)}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-md border-gray-300"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border-gray-300"
        >
          <option value="">All Categories</option>
          {['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={advancedFilters.status}
          onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
          className="rounded-md border-gray-300"
        >
          <option value="">All Status</option>
          <option value="active">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => handleUpdateStock(product.id, e.target.value)}
                    className="w-20 rounded-md border-gray-300"
                    min="0"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'active' ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                    >
                      <FiEdit2 className="h-5 w-5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts; 