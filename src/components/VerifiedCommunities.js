import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiUsers, FiMessageCircle, FiTrendingUp, FiStar, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, getDocs, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const VerifiedCommunities = () => {
  const { user } = useSelector((state) => state.auth);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCommunities, setUserCommunities] = useState([]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        // Set up real-time listener for communities
        const communitiesRef = collection(db, 'communities');
        
        const unsubscribe = onSnapshot(communitiesRef, (snapshot) => {
          const communitiesData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(community => community.featured) // Only show featured communities
            .slice(0, 4); // Limit to 4 communities for the homepage
            
          setCommunities(communitiesData);
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
            },
            {
              id: 'smart-home',
              name: 'Smart Home Innovators',
              category: 'Electronics',
              members: 876,
              image: 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
              description: 'Share your smart home configurations and tips',
              featured: true,
            },
            {
              id: 'fashion-forward',
              name: 'Fashion Forward',
              category: 'Fashion',
              members: 2340,
              image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
              description: 'Trending styles and fashion advice',
              featured: true,
            },
            {
              id: 'home-decor',
              name: 'Home Decor Dreams',
              category: 'Home & Living',
              members: 1890,
              image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
              description: 'Interior design ideas and inspiration',
              featured: false,
            },
          ];
          
          setCommunities(dummyCommunities.filter(c => c.featured));
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

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Verified Communities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join product-focused communities to discuss, share tips, and get recommendations from other enthusiasts
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {communities.map((community) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
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
                  <div className="flex justify-between items-center">
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
                    {userCommunities.includes(community.id) && (
                      <Link
                        to={`/community/${community.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/communities"
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
          >
            View All Communities
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifiedCommunities; 