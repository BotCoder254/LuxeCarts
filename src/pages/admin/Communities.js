import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiMessageCircle, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    image: '',
    featured: false,
  });

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      // Set up real-time listener for communities
      const communitiesRef = collection(db, 'communities');
      
      const unsubscribe = onSnapshot(communitiesRef, (snapshot) => {
        const communitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommunities(communitiesData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching communities:", error);
        toast.error('Failed to load communities');
        setLoading(false);
        
        // Fallback to dummy data if Firebase fetch fails
        const dummyCommunities = [
          {
            id: 'gaming-gear',
            name: 'Gaming Gear Enthusiasts',
            category: 'Electronics',
            members: 1250,
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            description: 'Discuss the latest gaming peripherals and setups',
            featured: true,
            createdAt: '2023-05-15',
            topics: 42,
            posts: 356,
          },
          {
            id: 'smart-home',
            name: 'Smart Home Innovators',
            category: 'Electronics',
            members: 876,
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            description: 'Share your smart home configurations and tips',
            featured: true,
            createdAt: '2023-06-22',
            topics: 28,
            posts: 213,
          },
          {
            id: 'fashion-forward',
            name: 'Fashion Forward',
            category: 'Fashion',
            members: 2340,
            image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            description: 'Trending styles and fashion advice',
            featured: true,
            createdAt: '2023-04-10',
            topics: 67,
            posts: 589,
          },
          {
            id: 'home-decor',
            name: 'Home Decor Dreams',
            category: 'Home & Living',
            members: 1890,
            image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
            description: 'Interior design ideas and inspiration',
            featured: false,
            createdAt: '2023-07-05',
            topics: 53,
            posts: 412,
          },
        ];
        
        setCommunities(dummyCommunities);
      });
      
      // Clean up listener on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up communities listener:', error);
      toast.error('Failed to load communities');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddCommunity = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form data
      if (!formData.name || !formData.category || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const newCommunity = {
        ...formData,
        members: 0,
        topics: 0,
        posts: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'communities'), newCommunity);
      
      setShowAddModal(false);
      resetForm();
      toast.success('Community created successfully');
    } catch (error) {
      console.error('Error adding community:', error);
      toast.error('Failed to create community');
    }
  };

  const handleEditCommunity = async (e) => {
    e.preventDefault();
    
    try {
      if (!editingCommunity) return;
      
      // Validate form data
      if (!formData.name || !formData.category || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'communities', editingCommunity.id), formData);
      
      setEditingCommunity(null);
      resetForm();
      toast.success('Community updated successfully');
    } catch (error) {
      console.error('Error updating community:', error);
      toast.error('Failed to update community');
    }
  };

  const handleDeleteCommunity = async (id) => {
    if (window.confirm('Are you sure you want to delete this community?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'communities', id));
        toast.success('Community deleted successfully');
      } catch (error) {
        console.error('Error deleting community:', error);
        toast.error('Failed to delete community');
      }
    }
  };

  const handleEditClick = (community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name,
      category: community.category,
      description: community.description,
      image: community.image,
      featured: community.featured,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      image: '',
      featured: false,
    });
  };

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Living',
    'Beauty',
    'Sports',
    'Books',
    'Jewelry',
    'Automotive',
    'Other',
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Communities</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-2" /> Add Community
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {communities.map((community) => (
              <motion.li
                key={community.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                      <img
                        src={community.image || 'https://via.placeholder.com/150'}
                        alt={community.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{community.name}</h3>
                        {community.featured && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{community.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FiUsers className="mr-1" /> {community.members || 0} members
                        </span>
                        <span className="flex items-center">
                          <FiMessageCircle className="mr-1" /> {community.topics || 0} topics
                        </span>
                        <span>Created on {community.createdAt || 'Unknown date'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(community)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCommunity(community.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Community Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Community</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddCommunity}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
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
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    id="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    id="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    Feature this community
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {editingCommunity && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Community</h2>
              <button
                onClick={() => {
                  setEditingCommunity(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditCommunity}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="edit-name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    id="edit-category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    id="edit-description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="edit-image" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    id="edit-image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    id="edit-featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-featured" className="ml-2 block text-sm text-gray-700">
                    Feature this community
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommunity(null);
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

export default Communities; 