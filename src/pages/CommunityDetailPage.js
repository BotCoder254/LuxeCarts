import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiUsers, FiMessageCircle, FiCalendar, FiArrowLeft, FiSend, FiUser, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, addDoc, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const CommunityDetailPage = () => {
  const { communityId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(null);
  const [replies, setReplies] = useState({});
  const [newReply, setNewReply] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        // Get community details
        const communityRef = doc(db, 'communities', communityId);
        const communitySnap = await getDoc(communityRef);
        
        if (communitySnap.exists()) {
          setCommunity({
            id: communitySnap.id,
            ...communitySnap.data()
          });
        } else {
          toast.error('Community not found');
          navigate('/communities');
        }
        
        // Check if user is a member
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setIsMember(userData.joinedCommunities?.includes(communityId) || false);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching community:', error);
        toast.error('Failed to load community');
        setLoading(false);
      }
    };
    
    fetchCommunity();
    
    // Set up listener for community topics
    if (communityId) {
      const topicsRef = collection(db, 'communities', communityId, 'topics');
      
      const unsubscribe = onSnapshot(topicsRef, (snapshot) => {
        const topicsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
          
        setTopics(topicsData);
      }, (error) => {
        console.error("Error fetching community topics:", error);
        
        // Fallback to dummy topics if Firebase fetch fails
        const dummyTopics = [
          {
            id: '1',
            title: 'Welcome to our community!',
            content: 'Introduce yourself and meet other members',
            createdBy: 'admin',
            createdAt: { seconds: Date.now() / 1000 },
            replies: 12
          },
          {
            id: '2',
            title: 'Tips and tricks for new users',
            content: 'Share your best advice for getting the most out of our products',
            createdBy: 'product_expert',
            createdAt: { seconds: (Date.now() - 86400000) / 1000 },
            replies: 8
          }
        ];
        
        setTopics(dummyTopics);
      });
      
      return () => unsubscribe();
    }
  }, [communityId, user, navigate]);

  // Fetch replies when a topic is selected for viewing replies
  useEffect(() => {
    if (showReplyModal) {
      const fetchReplies = async () => {
        setLoadingReplies(true);
        try {
          const repliesRef = collection(db, 'communities', communityId, 'topics', showReplyModal, 'replies');
          
          const unsubscribe = onSnapshot(repliesRef, (snapshot) => {
            const repliesData = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .sort((a, b) => a.createdAt - b.createdAt);
              
            setReplies(prevReplies => ({
              ...prevReplies,
              [showReplyModal]: repliesData
            }));
            setLoadingReplies(false);
          }, (error) => {
            console.error("Error fetching replies:", error);
            setLoadingReplies(false);
            
            // Fallback to empty array if Firebase fetch fails
            setReplies(prevReplies => ({
              ...prevReplies,
              [showReplyModal]: []
            }));
          });
          
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching replies:', error);
          setLoadingReplies(false);
        }
      };
      
      fetchReplies();
    }
  }, [showReplyModal, communityId]);

  const handleJoinCommunity = async () => {
    if (!user) {
      toast.error('Please log in to join communities');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const communityRef = doc(db, 'communities', communityId);
      
      if (isMember) {
        // Leave community
        await updateDoc(userRef, {
          joinedCommunities: arrayRemove(communityId)
        });
        
        await updateDoc(communityRef, {
          members: increment(-1),
          memberIds: arrayRemove(user.uid)
        });
        
        setIsMember(false);
        toast.success(`Left ${community.name}`);
      } else {
        // Join community
        await updateDoc(userRef, {
          joinedCommunities: arrayUnion(communityId)
        });
        
        await updateDoc(communityRef, {
          members: increment(1),
          memberIds: arrayUnion(user.uid)
        });
        
        setIsMember(true);
        toast.success(`Joined ${community.name}`);
      }
    } catch (error) {
      console.error('Error updating community membership:', error);
      toast.error('Failed to update community membership');
    }
  };

  const handleSubmitTopic = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create topics');
      return;
    }

    if (!isMember) {
      toast.error('You must be a member to post in this community');
      return;
    }

    if (!newTopic.trim() || !newTopicContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const topicData = {
        title: newTopic,
        content: newTopicContent,
        createdBy: user.displayName || user.email,
        createdById: user.uid,
        createdAt: serverTimestamp(),
        replies: 0
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'communities', communityId, 'topics'), topicData);
      
      // Update topics count
      await updateDoc(doc(db, 'communities', communityId), {
        topics: increment(1)
      });
      
      setNewTopic('');
      setNewTopicContent('');
      toast.success('Topic created successfully');
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to reply to topics');
      return;
    }

    if (!isMember) {
      toast.error('You must be a member to reply to topics in this community');
      return;
    }

    if (!newReply.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      const replyData = {
        content: newReply,
        createdBy: user.displayName || user.email,
        createdById: user.uid,
        createdAt: serverTimestamp(),
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'communities', communityId, 'topics', showReplyModal, 'replies'), replyData);
      
      // Update topic's reply count
      await updateDoc(doc(db, 'communities', communityId, 'topics', showReplyModal), {
        replies: increment(1)
      });
      
      // Update local state
      const updatedTopics = topics.map(topic => {
        if (topic.id === showReplyModal) {
          return { ...topic, replies: (topic.replies || 0) + 1 };
        }
        return topic;
      });
      setTopics(updatedTopics);
      
      setNewReply('');
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Community not found</h3>
            <Link to="/communities" className="text-indigo-600 hover:text-indigo-800">
              Return to Communities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/communities" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <FiArrowLeft className="mr-2" /> Back to Communities
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-48 bg-gray-200 relative">
            <img
              src={community.image || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'}
              alt={community.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
              }}
            />
            {community.featured && (
              <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                Featured
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex flex-wrap justify-between items-start">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{community.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{community.description}</p>
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                  <div className="flex items-center">
                    <FiUsers className="mr-1" />
                    {community.members || 0} members
                  </div>
                  <div className="flex items-center">
                    <FiMessageCircle className="mr-1" />
                    {community.topics || 0} topics
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" />
                    Created {community.createdAt ? formatDate(community.createdAt) : 'Unknown date'}
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-medium">
                    {community.category || 'General'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleJoinCommunity}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMember
                    ? 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isMember ? 'Leave Community' : 'Join Community'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Topics Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Community Topics</h2>
            {isMember && (
              <button
                onClick={() => document.getElementById('new-topic-form').scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Start New Topic
              </button>
            )}
          </div>
          
          {topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600 mb-3">{topic.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiUser className="mr-1" />
                      Posted by {topic.createdBy || 'Anonymous'}
                      <span className="mx-2">•</span>
                      {formatDate(topic.createdAt)}
                    </div>
                    <button 
                      onClick={() => setShowReplyModal(topic.id)}
                      className="flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                      <FiMessageCircle className="mr-1" />
                      {topic.replies || 0} replies
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No topics yet</h3>
              <p className="text-gray-500">Be the first to start a discussion in this community</p>
            </div>
          )}
        </div>
        
        {/* New Topic Form */}
        {isMember && (
          <div id="new-topic-form" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Topic</h2>
            <form onSubmit={handleSubmitTopic}>
              <div className="mb-4">
                <label htmlFor="topic-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  id="topic-title"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter a title for your topic"
                  maxLength={100}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="topic-content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  id="topic-content"
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Share your thoughts or questions with the community"
                  rows={4}
                  maxLength={1000}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <FiSend className="mr-2" /> Post Topic
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Not a member notice */}
        {!isMember && user && (
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <p className="text-indigo-800 mb-2">Join this community to start posting topics and participate in discussions.</p>
            <button
              onClick={handleJoinCommunity}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Join Community
            </button>
          </div>
        )}
        
        {/* Login notice */}
        {!user && (
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <p className="text-indigo-800 mb-2">Log in to join this community and participate in discussions.</p>
            <Link
              to="/login"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Log In
            </Link>
          </div>
        )}
        
        {/* Reply Modal */}
        <AnimatePresence>
          {showReplyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
              >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Replies</h3>
                  <button
                    onClick={() => setShowReplyModal(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingReplies ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : replies[showReplyModal]?.length > 0 ? (
                    <div className="space-y-4">
                      {replies[showReplyModal].map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-2">
                              {reply.createdBy?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{reply.createdBy}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No replies yet</h3>
                      <p className="text-gray-500">Be the first to reply to this topic</p>
                    </div>
                  )}
                </div>
                
                {user ? (
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleAddReply} className="flex">
                      <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Add a reply..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <FiSend />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border-t border-gray-200 text-center">
                    <p className="text-gray-500 mb-2">Please log in to add a reply</p>
                    <Link
                      to="/login"
                      className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommunityDetailPage; 