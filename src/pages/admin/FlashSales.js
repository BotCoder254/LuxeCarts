import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FiTrash2, FiUpload, FiClock, FiEdit, FiPlus, FiCalendar, FiSearch, FiBox, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';

const FlashSales = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSale, setNewSale] = useState({
    title: '',
    description: '',
    discountPercentage: 20,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '00:00',
    endTime: '23:59',
    productIds: [],
    imageUrl: '',
    active: true
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'flashSales'), (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate || new Date().toISOString(),
        endDate: doc.data().endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
      setFlashSales(salesData);
      setLoading(false);
    });

    // Fetch all products for selection
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProducts(productsData);
    });

    return () => {
      unsubscribe();
      productsUnsubscribe();
    };
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `flashSales/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setNewSale({
        ...newSale,
        imageUrl: url,
        storagePath: storageRef.fullPath
      });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSale = async () => {
    if (!newSale.title || !newSale.description || !newSale.imageUrl) {
      toast.error('Please fill all required fields and upload an image');
      return;
    }

    try {
      setUploading(true);
      
      // Combine date and time for start and end dates
      const startDateTime = new Date(`${newSale.startDate}T${newSale.startTime}`);
      const endDateTime = new Date(`${newSale.endDate}T${newSale.endTime}`);
      
      await addDoc(collection(db, 'flashSales'), {
        title: newSale.title,
        description: newSale.description,
        discountPercentage: Number(newSale.discountPercentage),
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        productIds: selectedProducts.map(p => p.id),
        imageUrl: newSale.imageUrl,
        storagePath: newSale.storagePath,
        active: newSale.active,
        createdAt: new Date().toISOString()
      });

      toast.success('Flash sale added successfully');
      setShowAddModal(false);
      setNewSale({
        title: '',
        description: '',
        discountPercentage: 20,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '00:00',
        endTime: '23:59',
        productIds: [],
        imageUrl: '',
        active: true
      });
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error adding flash sale:', error);
      toast.error('Failed to add flash sale');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (sale) => {
    try {
      if (sale.storagePath) {
        const storageRef = ref(storage, sale.storagePath);
        await deleteObject(storageRef);
      }
      await deleteDoc(doc(db, 'flashSales', sale.id));
      toast.success('Flash sale deleted successfully');
    } catch (error) {
      console.error('Error deleting flash sale:', error);
      toast.error('Failed to delete flash sale');
    }
  };

  const handleToggleActive = async (sale) => {
    try {
      await updateDoc(doc(db, 'flashSales', sale.id), {
        active: !sale.active
      });
      toast.success(`Flash sale ${!sale.active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating flash sale:', error);
      toast.error('Failed to update flash sale');
    }
  };

  const handleAddProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedProducts.find(p => p.id === product.id)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const calculateTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Flash Sales Manager</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiPlus />
              Add Flash Sale
            </button>
          </div>

          {/* Flash Sales List */}
          <div className="space-y-6">
            {flashSales.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <FiClock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No Flash Sales Yet</h3>
                <p className="text-gray-500 mt-2">Create your first flash sale to boost sales!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Flash Sale
                </button>
              </div>
            ) : (
              flashSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 h-48 md:h-auto relative">
                      <img
                        src={sale.imageUrl}
                        alt={sale.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold ${sale.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {sale.active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="text-white font-bold text-xl">{sale.discountPercentage}% OFF</div>
                      </div>
                    </div>
                    <div className="p-6 md:w-2/3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{sale.title}</h3>
                          <p className="text-gray-600 mt-2">{sale.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(sale)}
                            className={`p-2 rounded-md ${sale.active ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}
                          >
                            {sale.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(sale)}
                            className="p-2 bg-red-100 text-red-600 rounded-md"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FiCalendar className="mr-2" />
                            <span>Start: {formatDate(sale.startDate)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FiCalendar className="mr-2" />
                            <span>End: {formatDate(sale.endDate)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-sm font-semibold">
                            <FiClock className="mr-2 text-indigo-600" />
                            <span className="text-indigo-600">
                              Time Remaining: {calculateTimeRemaining(sale.endDate)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {sale.productIds?.length || 0} products on sale
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Flash Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add New Flash Sale</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newSale.title}
                      onChange={(e) => setNewSale({...newSale, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g. Summer Flash Sale"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newSale.description}
                      onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="3"
                      placeholder="Describe your flash sale"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Percentage
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={newSale.discountPercentage}
                      onChange={(e) => setNewSale({...newSale, discountPercentage: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newSale.startDate}
                        onChange={(e) => setNewSale({...newSale, startDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newSale.startTime}
                        onChange={(e) => setNewSale({...newSale, startTime: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newSale.endDate}
                        onChange={(e) => setNewSale({...newSale, endDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newSale.endTime}
                        onChange={(e) => setNewSale({...newSale, endTime: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Image
                    </label>
                    {newSale.imageUrl ? (
                      <div className="relative h-40 mb-2">
                        <img
                          src={newSale.imageUrl}
                          alt="Flash Sale Banner"
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          onClick={() => setNewSale({...newSale, imageUrl: '', storagePath: ''})}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <div className="text-center">
                          <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Upload an image'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Products for Sale
                    </label>
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="flex-1 px-3 py-2 border-none focus:outline-none"
                      />
                      <div className="px-3 py-2 bg-gray-100">
                        <FiSearch />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md h-64 overflow-y-auto mb-4">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No products found
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {filteredProducts.map(product => (
                          <li key={product.id} className="p-2 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {product.images && product.images[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded-md mr-3"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                                    <FiBox />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-gray-500">${product.price}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddProduct(product)}
                                className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-sm"
                              >
                                Add
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Products ({selectedProducts.length})
                    </label>
                    <div className="border rounded-md h-64 overflow-y-auto">
                      {selectedProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No products selected
                        </div>
                      ) : (
                        <ul className="divide-y">
                          {selectedProducts.map(product => (
                            <li key={product.id} className="p-2 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {product.images && product.images[0] ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-10 h-10 object-cover rounded-md mr-3"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                                      <FiBox />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-500">
                                      ${product.price} → ${(product.price * (1 - newSale.discountPercentage / 100)).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveProduct(product.id)}
                                  className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSale}
                  disabled={uploading || !newSale.title || !newSale.description || !newSale.imageUrl}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Saving...' : 'Save Flash Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FlashSales; 