import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiThumbsUp, FiMessageSquare, FiSearch, FiFilter, FiTrendingUp, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, onSnapshot, updateDoc, doc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const ProductIdeasPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [productIdeas, setProductIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProductIdeas = async () => {
      try {
        // Set up real-time listener for product ideas
        const productIdeasRef = collection(db, 'productIdeas');
        
        const unsubscribe = onSnapshot(productIdeasRef, (snapshot) => {
          const ideasData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => (b.votes || 0) - (a.votes || 0));
            
          setProductIdeas(ideasData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching product ideas:", error);
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
        setLoading(false);
      }
    };

    fetchProductIdeas();
  }, []);

  const handleVote = async (id) => {
    if (!user) {
      toast.error('Please log in to vote for product ideas');
      return;
    }

    try {
      // Update vote count in Firestore
      const ideaRef = doc(db, 'productIdeas', id);
      
      // Update the votes count and add user to voters array to prevent duplicate votes
      await updateDoc(ideaRef, {
        votes: increment(1),
        voters: arrayUnion(user.uid)
      });
      
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error voting for idea:', error);
      toast.error('Failed to record vote');
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

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product Ideas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vote on product ideas or submit your own. Help us build the products you want!
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product ideas..."
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
                      <span className="mr-4">Submitted by {idea.submittedBy || 'Anonymous'}</span>
                      <span>on {idea.submittedDate || 'Unknown date'}</span>
                      {idea.category && (
                        <span className="ml-4 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {idea.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(idea.id)}
                        className={`flex items-center text-sm ${
                          user && idea.voters?.includes(user.uid)
                            ? 'text-indigo-600 font-medium'
                            : 'text-gray-700 hover:text-indigo-600'
                        }`}
                        disabled={user && idea.voters?.includes(user.uid)}
                      >
                        <FiThumbsUp className="mr-1" /> {idea.votes || 0} votes
                      </button>
                      <span className="flex items-center text-sm text-gray-700">
                        <FiMessageSquare className="mr-1" /> {idea.comments || 0} comments
                      </span>
                    </div>
                  </div>
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
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No product ideas found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIdeasPage; 