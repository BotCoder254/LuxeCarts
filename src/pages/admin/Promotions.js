import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FiTrash2, FiUpload, FiPercent, FiEdit, FiPlus, FiCalendar, FiX, FiTag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    code: '',
    description: '',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minPurchase: 0,
    maxUses: 100,
    usedCount: 0,
    active: true,
    imageUrl: '',
    applyToAll: true,
    categoryIds: [],
    productIds: []
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'promotions'), (snapshot) => {
      const promoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate || new Date().toISOString(),
        endDate: doc.data().endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      setPromotions(promoData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `promotionImages/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setNewPromotion({
        ...newPromotion,
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

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromotion({...newPromotion, code});
  };

  const handleAddPromotion = async () => {
    if (!newPromotion.name || !newPromotion.code) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setUploading(true);
      
      const promoData = {
        name: newPromotion.name,
        code: newPromotion.code.toUpperCase(),
        description: newPromotion.description,
        discountType: newPromotion.discountType,
        discountValue: Number(newPromotion.discountValue),
        startDate: new Date(newPromotion.startDate).toISOString(),
        endDate: new Date(newPromotion.endDate).toISOString(),
        minPurchase: Number(newPromotion.minPurchase),
        maxUses: Number(newPromotion.maxUses),
        usedCount: editingPromotion ? editingPromotion.usedCount || 0 : 0,
        active: newPromotion.active,
        imageUrl: newPromotion.imageUrl,
        storagePath: newPromotion.storagePath,
        applyToAll: newPromotion.applyToAll,
        categoryIds: newPromotion.categoryIds,
        productIds: newPromotion.productIds,
        createdAt: editingPromotion ? editingPromotion.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingPromotion) {
        await updateDoc(doc(db, 'promotions', editingPromotion.id), promoData);
        toast.success('Promotion updated successfully');
      } else {
        await addDoc(collection(db, 'promotions'), promoData);
        toast.success('Promotion added successfully');
      }

      setShowAddModal(false);
      setEditingPromotion(null);
      setNewPromotion({
        name: '',
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        minPurchase: 0,
        maxUses: 100,
        usedCount: 0,
        active: true,
        imageUrl: '',
        applyToAll: true,
        categoryIds: [],
        productIds: []
      });
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast.error('Failed to save promotion');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (promotion) => {
    try {
      if (promotion.storagePath) {
        const storageRef = ref(storage, promotion.storagePath);
        await deleteObject(storageRef);
      }
      await deleteDoc(doc(db, 'promotions', promotion.id));
      toast.success('Promotion deleted successfully');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setNewPromotion({
      name: promotion.name || '',
      code: promotion.code || '',
      description: promotion.description || '',
      discountType: promotion.discountType || 'percentage',
      discountValue: promotion.discountValue || 10,
      startDate: new Date(promotion.startDate).toISOString().split('T')[0],
      endDate: new Date(promotion.endDate).toISOString().split('T')[0],
      minPurchase: promotion.minPurchase || 0,
      maxUses: promotion.maxUses || 100,
      usedCount: promotion.usedCount || 0,
      active: promotion.active !== undefined ? promotion.active : true,
      imageUrl: promotion.imageUrl || '',
      storagePath: promotion.storagePath || '',
      applyToAll: promotion.applyToAll !== undefined ? promotion.applyToAll : true,
      categoryIds: promotion.categoryIds || [],
      productIds: promotion.productIds || []
    });
    setShowAddModal(true);
  };

  const handleToggleActive = async (promotion) => {
    try {
      await updateDoc(doc(db, 'promotions', promotion.id), {
        active: !promotion.active
      });
      toast.success(`Promotion ${!promotion.active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Failed to update promotion');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const getStatusBadge = (promotion) => {
    if (!promotion.active) {
      return <span className="bg-gray-500 text-white px-2 py-1 rounded-md text-xs font-semibold">Inactive</span>;
    }
    if (isExpired(promotion.endDate)) {
      return <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">Expired</span>;
    }
    if (new Date(promotion.startDate) > new Date()) {
      return <span className="bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-semibold">Scheduled</span>;
    }
    return <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">Active</span>;
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
            <h1 className="text-2xl font-bold">Promotions Manager</h1>
            <button
              onClick={() => {
                setEditingPromotion(null);
                setNewPromotion({
                  name: '',
                  code: '',
                  description: '',
                  discountType: 'percentage',
                  discountValue: 10,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  minPurchase: 0,
                  maxUses: 100,
                  usedCount: 0,
                  active: true,
                  imageUrl: '',
                  applyToAll: true,
                  categoryIds: [],
                  productIds: []
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <FiPlus />
              Add Promotion
            </button>
          </div>

          {/* Promotions List */}
          <div className="space-y-6">
            {promotions.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <FiTag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No Promotions Yet</h3>
                <p className="text-gray-500 mt-2">Create your first promotion code to boost sales!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Promotion
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promotion
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Validity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {promotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {promotion.imageUrl ? (
                                <img 
                                  src={promotion.imageUrl} 
                                  alt={promotion.name} 
                                  className="h-10 w-10 rounded-md object-cover mr-3"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center mr-3">
                                  <FiTag className="text-indigo-600" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{promotion.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 rounded-md">
                              {promotion.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {promotion.discountType === 'percentage' 
                                ? `${promotion.discountValue !== undefined ? promotion.discountValue : 0}%` 
                                : `$${(promotion.discountValue !== undefined ? promotion.discountValue : 0).toFixed(2)}`}
                            </div>
                            {(promotion.minPurchase || 0) > 0 && (
                              <div className="text-xs text-gray-500">
                                Min. purchase: ${(promotion.minPurchase || 0).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {promotion.usedCount} / {promotion.maxUses} uses
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(promotion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2 items-center justify-start">
                              <button
                                onClick={() => handleToggleActive(promotion)}
                                className={`px-2 py-1 text-xs rounded-md ${promotion.active ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'} whitespace-nowrap`}
                                title={promotion.active ? 'Deactivate' : 'Activate'}
                              >
                                {promotion.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleEdit(promotion)}
                                className="p-2 bg-indigo-100 text-indigo-600 rounded-md"
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(promotion)}
                                className="p-2 bg-red-100 text-red-600 rounded-md"
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Promotion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
                </h2>
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
                      Promotion Name*
                    </label>
                    <input
                      type="text"
                      value={newPromotion.name}
                      onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="e.g. Summer Sale"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Promo Code*
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={newPromotion.code}
                        onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border rounded-l-md"
                        placeholder="e.g. SUMMER20"
                      />
                      <button
                        onClick={generatePromoCode}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-r-md"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newPromotion.description}
                      onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="3"
                      placeholder="Describe your promotion"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={newPromotion.discountType}
                        onChange={(e) => setNewPromotion({...newPromotion, discountType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Value
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step={newPromotion.discountType === 'percentage' ? '1' : '0.01'}
                          value={newPromotion.discountValue}
                          onChange={(e) => setNewPromotion({...newPromotion, discountValue: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {newPromotion.discountType === 'percentage' ? '%' : '$'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Purchase
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPromotion.minPurchase}
                        onChange={(e) => setNewPromotion({...newPromotion, minPurchase: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-md pl-6"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        $
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newPromotion.startDate}
                        onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newPromotion.endDate}
                        onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPromotion.maxUses}
                      onChange={(e) => setNewPromotion({...newPromotion, maxUses: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Promotion Image
                    </label>
                    {newPromotion.imageUrl ? (
                      <div className="relative h-40 mb-2">
                        <img
                          src={newPromotion.imageUrl}
                          alt="Promotion Banner"
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          onClick={() => setNewPromotion({...newPromotion, imageUrl: '', storagePath: ''})}
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

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="active"
                      checked={newPromotion.active}
                      onChange={(e) => setNewPromotion({...newPromotion, active: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="applyToAll"
                      checked={newPromotion.applyToAll}
                      onChange={(e) => setNewPromotion({...newPromotion, applyToAll: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="applyToAll" className="ml-2 block text-sm text-gray-900">
                      Apply to all products
                    </label>
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
                  onClick={handleAddPromotion}
                  disabled={uploading || !newPromotion.name || !newPromotion.code}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Saving...' : editingPromotion ? 'Update Promotion' : 'Save Promotion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Promotions; 