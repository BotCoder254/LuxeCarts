import React, { useState, useEffect } from 'react';
import { FiThumbsUp, FiMessageSquare, FiEdit2, FiTrash2, FiCheck, FiX, FiFilter, FiDownload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const ProductIdeas = () => {
  const [productIdeas, setProductIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingIdea, setEditingIdea] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'voting',
  });

  useEffect(() => {
    fetchProductIdeas();
  }, []);

  const fetchProductIdeas = async () => {
    setLoading(true);
    try {
      // Set up real-time listener for product ideas
      const productIdeasRef = collection(db, 'productIdeas');
      
      const unsubscribe = onSnapshot(productIdeasRef, (snapshot) => {
        const ideasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProductIdeas(ideasData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching product ideas:", error);
        toast.error('Failed to load product ideas');
        setLoading(false);
        
        // Fallback to dummy data if Firebase fetch fails
        const dummyIdeas = [
          {
            id: '1',
            title: 'Eco-friendly Smart Water Bottle',
            description: 'A water bottle that tracks hydration and has biodegradable components',
            votes: 342,
            comments: 28,
            status: 'voting',
            submittedBy: 'eco_enthusiast',
            submittedDate: '2023-10-15',
            category: 'Electronics',
          },
          {
            id: '2',
            title: 'Modular Gaming Controller',
            description: 'Customizable controller with swappable components for different game genres',
            votes: 567,
            comments: 45,
            status: 'development',
            submittedBy: 'gamer_pro',
            submittedDate: '2023-09-22',
            category: 'Electronics',
          },
          {
            id: '3',
            title: 'Multi-functional Desk Organizer',
            description: 'Desk organizer with built-in wireless charging and smart storage solutions',
            votes: 289,
            comments: 19,
            status: 'voting',
            submittedBy: 'office_ninja',
            submittedDate: '2023-11-03',
            category: 'Home & Living',
          },
          {
            id: '4',
            title: 'Sustainable Yoga Mat with Alignment Guides',
            description: 'Eco-friendly yoga mat with built-in alignment markers and posture guidance',
            votes: 421,
            comments: 32,
            status: 'completed',
            submittedBy: 'yoga_master',
            submittedDate: '2023-08-05',
            category: 'Sports',
          },
        ];
        
        setProductIdeas(dummyIdeas);
      });
      
      // Clean up listener on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up product ideas listener:', error);
      toast.error('Failed to load product ideas');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdateIdea = async (e) => {
    e.preventDefault();
    
    try {
      if (!editingIdea) return;
      
      // Validate form data
      if (!formData.title || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'productIdeas', editingIdea.id), formData);
      
      setEditingIdea(null);
      resetForm();
      toast.success('Product idea updated successfully');
    } catch (error) {
      console.error('Error updating product idea:', error);
      toast.error('Failed to update product idea');
    }
  };

  const handleDeleteIdea = async (id) => {
    if (window.confirm('Are you sure you want to delete this product idea?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'productIdeas', id));
        toast.success('Product idea deleted successfully');
      } catch (error) {
        console.error('Error deleting product idea:', error);
        toast.error('Failed to delete product idea');
      }
    }
  };

  const handleEditClick = (idea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      description: idea.description,
      status: idea.status,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'voting',
    });
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = ['ID', 'Title', 'Description', 'Votes', 'Comments', 'Status', 'Submitted By', 'Submitted Date', 'Category'];
      const csvContent = [
        headers.join(','),
        ...productIdeas.map(idea => [
          idea.id,
          `"${idea.title?.replace(/"/g, '""') || ''}"`,
          `"${idea.description?.replace(/"/g, '""') || ''}"`,
          idea.votes || 0,
          idea.comments || 0,
          idea.status || '',
          idea.submittedBy || '',
          idea.submittedDate || '',
          idea.category || ''
        ].join(','))
      ].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'product-ideas.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const filteredIdeas = filter === 'all' 
    ? productIdeas 
    : productIdeas.filter(idea => idea.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'voting':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Voting
          </span>
        );
      case 'development':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            In Development
          </span>
        );
      case 'completed':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Ideas</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Ideas</option>
              <option value="voting">Voting</option>
              <option value="development">In Development</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <FiFilter className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => (
                <motion.li
                  key={idea.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{idea.title}</h3>
                        <div className="ml-2">{getStatusBadge(idea.status)}</div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{idea.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FiThumbsUp className="mr-1" /> {idea.votes || 0} votes
                        </span>
                        <span className="flex items-center">
                          <FiMessageSquare className="mr-1" /> {idea.comments || 0} comments
                        </span>
                        <span>Submitted by {idea.submittedBy || 'Anonymous'} on {idea.submittedDate || 'Unknown date'}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {idea.category || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditClick(idea)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))
            ) : (
              <li className="px-6 py-12 text-center text-gray-500">
                No product ideas found matching the selected filter.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Product Idea</h2>
              <button
                onClick={() => {
                  setEditingIdea(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateIdea}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="voting">Voting</option>
                    <option value="development">In Development</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingIdea(null);
                    resetForm();
                  }}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductIdeas; 