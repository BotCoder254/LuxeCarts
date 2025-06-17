import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiShield, FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const InsuranceManagement = () => {
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    rate: '',
    isPercentage: true,
    minCoverage: '',
    maxCoverage: '',
    isActive: true
  });

  useEffect(() => {
    fetchInsurancePlans();
  }, []);

  const fetchInsurancePlans = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'insurancePlans'));
      const querySnapshot = await getDocs(q);
      const plansData = [];
      querySnapshot.forEach((doc) => {
        plansData.push({ id: doc.id, ...doc.data() });
      });
      setInsurancePlans(plansData);
    } catch (error) {
      console.error('Error fetching insurance plans:', error);
      toast.error('Failed to load insurance plans');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        rate: parseFloat(formData.rate),
        isPercentage: formData.isPercentage,
        minCoverage: formData.minCoverage ? parseFloat(formData.minCoverage) : null,
        maxCoverage: formData.maxCoverage ? parseFloat(formData.maxCoverage) : null,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };
      
      if (editingPlan) {
        // Update existing plan
        await updateDoc(doc(db, 'insurancePlans', editingPlan.id), planData);
        toast.success('Insurance plan updated successfully');
      } else {
        // Add new plan
        planData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'insurancePlans'), planData);
        toast.success('Insurance plan added successfully');
      }
      
      // Reset form and close modal
      resetForm();
      setIsModalOpen(false);
      fetchInsurancePlans();
    } catch (error) {
      console.error('Error saving insurance plan:', error);
      toast.error('Failed to save insurance plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      id: plan.id,
      name: plan.name || '',
      description: plan.description || '',
      rate: plan.rate || '',
      isPercentage: plan.isPercentage !== false,
      minCoverage: plan.minCoverage || '',
      maxCoverage: plan.maxCoverage || '',
      isActive: plan.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this insurance plan?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'insurancePlans', id));
      toast.success('Insurance plan deleted successfully');
      fetchInsurancePlans();
    } catch (error) {
      console.error('Error deleting insurance plan:', error);
      toast.error('Failed to delete insurance plan');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      rate: '',
      isPercentage: true,
      minCoverage: '',
      maxCoverage: '',
      isActive: true
    });
    setEditingPlan(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Insurance Plans</h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" /> Add Plan
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading insurance plans...</p>
          </div>
        ) : insurancePlans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiShield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No insurance plans</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add insurance plans to offer coverage options to your customers.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coverage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insurancePlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FiShield className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            <div className="text-sm text-gray-500">{plan.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {plan.rate}{plan.isPercentage ? '%' : ' flat fee'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {plan.minCoverage && `Min: $${plan.minCoverage}`}
                          {plan.minCoverage && plan.maxCoverage && ' | '}
                          {plan.maxCoverage && `Max: $${plan.maxCoverage}`}
                          {!plan.minCoverage && !plan.maxCoverage && 'No limits'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FiEdit className="inline-block mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline-block mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingPlan ? 'Edit Insurance Plan' : 'Add Insurance Plan'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {formData.isPercentage ? '%' : <FiDollarSign />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      id="isPercentage"
                      name="isPercentage"
                      checked={formData.isPercentage}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPercentage" className="ml-2 block text-sm text-gray-900">
                      Percentage based
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Coverage ($)
                    </label>
                    <input
                      type="number"
                      name="minCoverage"
                      value={formData.minCoverage}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Coverage ($)
                    </label>
                    <input
                      type="number"
                      name="maxCoverage"
                      value={formData.maxCoverage}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingPlan ? 'Update Plan' : 'Add Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagement;