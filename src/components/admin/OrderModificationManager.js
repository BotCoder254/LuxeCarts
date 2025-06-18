import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiEdit, FiCheck, FiX, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ModificationStatus } from '../../types/order';

const OrderModificationManager = ({ order, onUpdate }) => {
  const [selectedModification, setSelectedModification] = useState(null);
  const [modificationResponse, setModificationResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [maxModifications, setMaxModifications] = useState(
    order.maxModificationsAllowed || 3
  );

  // Filter pending modifications
  const pendingModifications = order.modifications?.filter(
    mod => mod.status === ModificationStatus.PENDING
  ) || [];

  // Filter responded modifications
  const respondedModifications = order.modifications?.filter(
    mod => mod.status !== ModificationStatus.PENDING
  ) || [];

  // Handle modification request response
  const handleModificationResponse = async (status) => {
    if (!selectedModification) return;
    
    try {
      const orderRef = doc(db, 'orders', order.id);
      
      // Find and update the modification request
      const updatedModifications = order.modifications.map(mod => {
        if (mod.id === selectedModification.id) {
          return {
            ...mod,
            status,
            responseDate: new Date(),
            responseText: modificationResponse,
            respondedBy: 'Admin'
          };
        }
        return mod;
      });
      
      // Update the order in Firestore
      await updateDoc(orderRef, {
        modifications: updatedModifications,
        updatedAt: new Date()
      });
      
      toast.success(`Modification request ${status.toLowerCase()}`);
      setShowResponseModal(false);
      setSelectedModification(null);
      setModificationResponse('');
      
      // Call the parent update function
      if (onUpdate) {
        onUpdate({
          ...order,
          modifications: updatedModifications,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating modification request:', error);
      toast.error('Failed to update modification request');
    }
  };

  // Update max modifications allowed
  const updateMaxModifications = async () => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      
      await updateDoc(orderRef, {
        maxModificationsAllowed: maxModifications,
        updatedAt: new Date()
      });
      
      toast.success('Max modifications updated');
      
      // Call the parent update function
      if (onUpdate) {
        onUpdate({
          ...order,
          maxModificationsAllowed: maxModifications,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating max modifications:', error);
      toast.error('Failed to update max modifications');
    }
  };

  // Check if there are any modifications
  if (!order.modifications || order.modifications.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <p className="text-gray-500 text-center">No modification requests for this order</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FiEdit className="mr-2" /> Order Modifications
        </h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Max allowed:</label>
          <select
            value={maxModifications}
            onChange={(e) => setMaxModifications(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[0, 1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <button
            onClick={updateMaxModifications}
            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
          >
            Update
          </button>
        </div>
      </div>

      {pendingModifications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <FiAlertTriangle className="text-yellow-500 mr-2" />
            <h4 className="font-medium">Pending Requests</h4>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingModifications.map((mod) => (
                  <tr key={mod.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {mod.requestDate?.toDate
                        ? mod.requestDate.toDate().toLocaleDateString()
                        : new Date(mod.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{mod.description}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedModification(mod);
                          setShowResponseModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {respondedModifications.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Previous Modifications</h4>
          <div className="space-y-3">
            {respondedModifications.map((mod) => (
              <div key={mod.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {mod.requestDate?.toDate
                      ? mod.requestDate.toDate().toLocaleDateString()
                      : new Date(mod.requestDate).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    mod.status === ModificationStatus.APPROVED
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {mod.status === ModificationStatus.APPROVED ? (
                      <span className="flex items-center">
                        <FiCheckCircle className="mr-1" /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiXCircle className="mr-1" /> Rejected
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{mod.description}</p>
                {mod.responseText && (
                  <div className="text-xs bg-white p-2 rounded border border-gray-200">
                    <span className="font-medium">Response:</span> {mod.responseText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedModification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Respond to Modification Request</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Customer's request:</p>
              <p className="p-2 bg-gray-50 rounded-md">{selectedModification.description}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Response (optional)
              </label>
              <textarea
                value={modificationResponse}
                onChange={(e) => setModificationResponse(e.target.value)}
                className="w-full border rounded-md p-2 h-32"
                placeholder="Provide any details about your decision..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModificationResponse(ModificationStatus.REJECTED)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FiX /> Reject
              </button>
              <button
                onClick={() => handleModificationResponse(ModificationStatus.APPROVED)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiCheck /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderModificationManager; 