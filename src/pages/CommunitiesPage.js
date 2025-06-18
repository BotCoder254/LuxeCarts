import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiUsers, FiMessageCircle, FiSearch, FiFilter, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const CommunitiesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        // Set up real-time listener for communities
        const communitiesRef = collection(db, 'communities');
        
        const unsubscribe = onSnapshot(communitiesRef, (snapshot) => {
          const communitiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCommunities(communitiesData);
          
          // Extract unique categories for filter
          const uniqueCategories = ['all', ...new Set(communitiesData.map(c => c.category).filter(Boolean))];
          setCategories(uniqueCategories);
          
          setLoading(false);
        }, (error) => {
          console.error("Error fetching communities:", error);
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
          
          // Extract unique categories for filter
          const uniqueCategories = ['all', ...new Set(dummyCommunities.map(c => c.category).filter(Boolean))];
          setCategories(uniqueCategories);
        });
        
        // Clean up listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up communities listener:', error);
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // Fetch user's joined communities
  useEffect(() => {
    if (user) {
      const fetchUserCommunities = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          
          const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              const userData = doc.data();
              setUserCommunities(userData.joinedCommunities || []);
            }
          }, (error) => {
            console.error("Error fetching user communities:", error);
          });
          
          return () => unsubscribe();
        } catch (error) {
          console.error('Error setting up user communities listener:', error);
        }
      };
      
      fetchUserCommunities();
    } else {
      setUserCommunities([]);
    }
  }, [user]);

  const handleJoinCommunity = async (communityId, communityName) => {
    if (!user) {
      toast.error('Please log in to join communities');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const communityRef = doc(db, 'communities', communityId);
      
      if (userCommunities.includes(communityId)) {
        // Leave community
        await updateDoc(userRef, {
          joinedCommunities: arrayRemove(communityId)
        });
        
        await updateDoc(communityRef, {
          members: increment(-1),
          memberIds: arrayRemove(user.uid)
        });
        
        toast.success(`Left ${communityName}`);
      } else {
        // Join community
        await updateDoc(userRef, {
          joinedCommunities: arrayUnion(communityId)
        });
        
        await updateDoc(communityRef, {
          members: increment(1),
          memberIds: arrayUnion(user.uid)
        });
        
        toast.success(`Joined ${communityName}`);
      }
    } catch (error) {
      console.error('Error updating community membership:', error);
      toast.error('Failed to update community membership');
    }
  };

  // Filter communities based on search query and category
  const filteredCommunities = communities.filter(community => {
    const matchesSearch = searchQuery === '' || 
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || community.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Communities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join product-focused communities to discuss, share tips, and get recommendations from other enthusiasts
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative w-full md:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCommunities.map((community) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={community.image || 'https://via.placeholder.com/150'}
                    alt={community.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                  {community.featured && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {community.category || 'General'}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiUsers className="mr-1" />
                      {(community.members || 0).toLocaleString()}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <FiMessageCircle className="inline mr-1" />
                      {community.topics || 0} topics
                    </div>
                    <div className="flex items-center space-x-3">
                      {userCommunities.includes(community.id) && (
                        <Link
                          to={`/community/${community.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </Link>
                      )}
                      <button
                        onClick={() => handleJoinCommunity(community.id, community.name)}
                        className={`inline-flex items-center px-4 py-2 border ${
                          userCommunities.includes(community.id)
                            ? 'border-gray-300 text-gray-700 bg-gray-100'
                            : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                        } text-sm font-medium rounded-md transition-all duration-200`}
                      >
                        {userCommunities.includes(community.id) ? (
                          <>
                            <FiCheck className="mr-2" /> Joined
                          </>
                        ) : (
                          'Join Community'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitiesPage; 