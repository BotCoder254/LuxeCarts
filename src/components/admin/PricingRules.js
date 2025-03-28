import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiClock, FiMapPin } from 'react-icons/fi';
import { fetchPricingRules, createPricingRule, updatePricingRule, deletePricingRule } from '../../store/slices/pricingSlice';
import toast from 'react-hot-toast';

const PricingRules = () => {
  const dispatch = useDispatch();
  const { rules, status } = useSelector((state) => state.pricing);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    type: 'bulk',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minQuantity: 0,
    startDate: '',
    endDate: '',
    regions: [],
    adjustmentType: 'percentage',
    adjustmentValue: 0
  });

  useEffect(() => {
    dispatch(fetchPricingRules());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await dispatch(updatePricingRule({ id: editingRule.id, data: formData })).unwrap();
        toast.success('Rule updated successfully');
      } else {
        await dispatch(createPricingRule(formData)).unwrap();
        toast.success('Rule created successfully');
      }
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await dispatch(deletePricingRule(id)).unwrap();
        toast.success('Rule deleted successfully');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'bulk',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minQuantity: 0,
      startDate: '',
      endDate: '',
      regions: [],
      adjustmentType: 'percentage',
      adjustmentValue: 0
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const getRuleIcon = (type) => {
    switch (type) {
      case 'bulk':
        return <FiTag className="w-5 h-5" />;
      case 'sale':
        return <FiClock className="w-5 h-5" />;
      case 'location':
        return <FiMapPin className="w-5 h-5" />;
      default:
        return <FiTag className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Pricing Rules</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FiPlus /> Add Rule
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg mb-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="bulk">Bulk Discount</option>
                  <option value="sale">Time-Limited Sale</option>
                  <option value="location">Location-Based Pricing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>

              {formData.type !== 'location' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </>
              )}

              {formData.type === 'bulk' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
              )}

              {(formData.type === 'sale' || formData.type === 'location') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {editingRule ? 'Update' : 'Create'} Rule
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-4 rounded-lg shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRuleIcon(rule.type)}
                <h3 className="font-semibold">{rule.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setFormData(rule);
                    setShowForm(true);
                  }}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{rule.description}</p>
            <div className="mt-2 text-sm">
              {rule.type === 'bulk' && (
                <p>
                  {rule.discountType === 'percentage' ? `${rule.discountValue}% off` : `$${rule.discountValue} off`}
                  {' when buying '}{rule.minQuantity}+ items
                </p>
              )}
              {rule.type === 'sale' && (
                <p>
                  {rule.discountType === 'percentage' ? `${rule.discountValue}% off` : `$${rule.discountValue} off`}
                  {' until '}{new Date(rule.endDate).toLocaleDateString()}
                </p>
              )}
              {rule.type === 'location' && (
                <p>
                  {rule.adjustmentType === 'percentage' ? `${rule.adjustmentValue}%` : `$${rule.adjustmentValue}`}
                  {' adjustment for '}{rule.regions.join(', ')}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PricingRules;
