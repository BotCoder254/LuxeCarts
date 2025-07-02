import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiMessageCircle, FiSearch, FiPlus, FiExternalLink } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const MyCommunitiesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    
    const fetchJoinedCommunities = async () => {
      setLoading(true);
      try {
        // Get user's joined communities IDs
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const joinedCommunityIds = userData.joinedCommunities || [];
            
            if (joinedCommunityIds.length === 0) {
              setJoinedCommunities([]);
              setLoading(false);
              return;
            }
            
            // Get community details for each ID
            const communitiesRef = collection(db, 'communities');
            const communitiesSnap = await getDocs(communitiesRef);
            
            const communitiesData = communitiesSnap.docs
              .filter(doc => joinedCommunityIds.includes(doc.id))
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            
            setJoinedCommunities(communitiesData);
            setLoading(false);
          } else {
            setJoinedCommunities([]);
            setLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching joined communities:', error);
        setJoinedCommunities([]);
        setLoading(false);
      }
    };
    
    fetchJoinedCommunities();
  }, [user, navigate]);

  // Filter communities based on search query
  const filteredCommunities = joinedCommunities.filter(community => {
    return searchQuery === '' || 
      community.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Communities</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View and manage the communities you've joined
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my communities..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Link
            to="/communities"
            className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="mr-2" /> Discover Communities
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="h-40 bg-gray-200 relative">
                  <img
                    src={community.image || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}
                    alt={community.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';
                    }}
                  />
                  {community.featured && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{community.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{community.description}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <div className="mr-4 flex items-center">
                      <FiUsers className="mr-1" />
                      {community.members || 0} members
                    </div>
                    <div className="flex items-center">
                      <FiMessageCircle className="mr-1" />
                      {community.topics || 0} topics
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {community.category || 'General'}
                    </span>
                    <Link
                      to={`/community/${community.id}`}
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <FiExternalLink className="mr-1" /> View Community
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-medium text-gray-900">No communities joined yet</h3>
            <p className="mt-1 text-gray-500">Join communities to connect with other users and discuss products.</p>
            <div className="mt-6">
              <Link
                to="/communities"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Communities
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCommunitiesPage; 