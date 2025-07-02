import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiThumbsUp, FiMessageSquare, FiSearch, FiFilter, FiTrendingUp, FiAward, FiEdit, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const MyProductIdeasPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [productIdeas, setProductIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    
    const fetchMyProductIdeas = async () => {
      try {
        // Set up real-time listener for the user's product ideas
        const ideasRef = collection(db, 'productIdeas');
        const q = query(ideasRef, where('submittedById', '==', user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const ideasData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => {
              // Sort by creation date (newest first)
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
            });
            
          setProductIdeas(ideasData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching product ideas:", error);
          setLoading(false);
          
          // Fallback to empty array if Firebase fetch fails
          setProductIdeas([]);
        });
        
        // Clean up listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up product ideas listener:', error);
        setLoading(false);
      }
    };

    fetchMyProductIdeas();
  }, [user, navigate]);

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

  // Filter ideas based on search query and status
  const filteredIdeas = productIdeas.filter(idea => {
    const matchesSearch = searchQuery === '' || 
      idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Product Ideas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View and manage the product ideas you've submitted
          </p>
        </div>

        <div className="flex flex-wrap justify-between items-center mb-8">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-4 md:mb-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your ideas..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative w-full md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="voting">Voting</option>
                <option value="development">In Development</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <Link
            to="/product-ideas"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View All Ideas
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredIdeas.length > 0 ? (
          <div className="space-y-6">
            {filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-xl font-semibold text-gray-900 mr-2">{idea.title}</h3>
                      <div>{getStatusBadge(idea.status)}</div>
                    </div>
                    <p className="text-gray-600 my-3">{idea.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-4">Submitted on {formatDate(idea.createdAt) || idea.submittedDate || 'Unknown date'}</span>
                      {idea.category && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {idea.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center text-sm text-gray-700">
                        <FiThumbsUp className="mr-1" /> {idea.votes || 0} votes
                      </span>
                      <span className="flex items-center text-sm text-gray-700">
                        <FiMessageSquare className="mr-1" /> {idea.comments || 0} comments
                      </span>
                      <Link
                        to={`/product-idea/${idea.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {idea.status === 'voting' && (
                      <>
                        <button
                          onClick={() => navigate(`/edit-product-idea/${idea.id}`)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit idea"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete idea"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {idea.status === 'development' && (
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <FiTrendingUp className="w-6 h-6 text-indigo-600" />
                      </div>
                    )}
                    {idea.status === 'completed' && (
                      <div className="bg-green-100 p-3 rounded-full">
                        <FiAward className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiMessageSquare className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No product ideas found</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any product ideas yet</p>
            <Link
              to="/product-ideas"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Submit a Product Idea
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProductIdeasPage; 