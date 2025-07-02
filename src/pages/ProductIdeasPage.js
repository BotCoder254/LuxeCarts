import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiThumbsUp, FiMessageSquare, FiSearch, FiFilter, FiTrendingUp, FiAward, FiSend, FiX, FiUser, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, updateDoc, doc, arrayUnion, increment, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const ProductIdeasPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [productIdeas, setProductIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCommentModal, setShowCommentModal] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

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

  // Fetch comments when a product idea is selected for viewing comments
  useEffect(() => {
    if (showCommentModal) {
      const fetchComments = async () => {
        try {
          const commentsRef = collection(db, 'productIdeas', showCommentModal, 'comments');
          
          const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
            const commentsData = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .sort((a, b) => b.createdAt - a.createdAt);
              
            setComments(prevComments => ({
              ...prevComments,
              [showCommentModal]: commentsData
            }));
          }, (error) => {
            console.error("Error fetching comments:", error);
            
            // Fallback to dummy comments if Firebase fetch fails
            const dummyComments = [
              {
                id: '1',
                text: 'This is an amazing idea! I would definitely buy this.',
                userName: 'enthusiastic_user',
                createdAt: { seconds: Date.now() / 1000 }
              },
              {
                id: '2',
                text: 'I wonder if this could be made affordable for the average consumer?',
                userName: 'practical_shopper',
                createdAt: { seconds: (Date.now() - 3600000) / 1000 }
              }
            ];
            
            setComments(prevComments => ({
              ...prevComments,
              [showCommentModal]: dummyComments
            }));
          });
          
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      };
      
      fetchComments();
    }
  }, [showCommentModal]);

  const handleVote = async (id) => {
    if (!user) {
      toast.error('Please log in to vote for product ideas');
      return;
    }

    try {
      // Check if user has already voted
      const ideaRef = doc(db, 'productIdeas', id);
      const ideaDoc = await getDoc(ideaRef);
      const ideaData = ideaDoc.data();
      
      if (ideaData.voters?.includes(user.uid)) {
        toast.error('You have already voted for this idea');
        return;
      }
      
      // Update vote count in Firestore
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to add comments');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const commentData = {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp()
      };
      
      // Add comment to Firestore
      await addDoc(collection(db, 'productIdeas', showCommentModal, 'comments'), commentData);
      
      // Update comment count
      await updateDoc(doc(db, 'productIdeas', showCommentModal), {
        comments: increment(1)
      });
      
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit product ideas');
      return;
    }

    if (!newIdea.trim() || !newDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newIdeaObj = {
        title: newIdea,
        description: newDescription,
        category: newCategory || 'General',
        votes: 1,
        comments: 0,
        status: 'voting',
        submittedBy: user.displayName || user.email,
        submittedById: user.uid,
        submittedDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        voters: [user.uid] // Add the creator as the first voter
      };

      // Add to Firestore
      await addDoc(collection(db, 'productIdeas'), newIdeaObj);
      
      setNewIdea('');
      setNewDescription('');
      setNewCategory('');
      setShowSubmitForm(false);
      toast.success('Your product idea has been submitted for approval!');
    } catch (error) {
      console.error('Error submitting product idea:', error);
      toast.error('Failed to submit product idea');
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
    if (!timestamp) return 'Just now';
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product Ideas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vote on product ideas or submit your own. Help us build the products you want!
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
          
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FiPlus className="mr-2" /> Submit Idea
          </button>
        </div>

        {/* Submit Idea Form */}
        <AnimatePresence>
          {showSubmitForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white rounded-lg p-6 shadow-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Submit Your Product Idea</h4>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitIdea}>
                <div className="mb-4">
                  <label htmlFor="idea-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Idea Title *
                  </label>
                  <input
                    type="text"
                    id="idea-title"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter a concise title for your product idea"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="idea-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="idea-description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe your product idea in detail"
                    rows={4}
                    maxLength={500}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="idea-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="idea-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Submit for Approval
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

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
                      <button
                        onClick={() => setShowCommentModal(idea.id)}
                        className="flex items-center text-sm text-gray-700 hover:text-indigo-600"
                      >
                        <FiMessageSquare className="mr-1" /> {idea.comments || 0} comments
                      </button>
                      <Link
                        to={`/product-idea/${idea.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Details
                      </Link>
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

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
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
                <h3 className="text-xl font-semibold text-gray-900">Comments</h3>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {comments[showCommentModal]?.length > 0 ? (
                  <div className="space-y-4">
                    {comments[showCommentModal].map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-2">
                            {comment.userPhotoURL ? (
                              <img src={comment.userPhotoURL} alt={comment.userName} className="w-8 h-8 rounded-full" />
                            ) : (
                              comment.userName?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{comment.userName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No comments yet</h3>
                    <p className="text-gray-500">Be the first to comment on this idea</p>
                  </div>
                )}
              </div>
              
              {user ? (
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleAddComment} className="flex">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
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
                  <p className="text-gray-500 mb-2">Please log in to add a comment</p>
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
  );
};

export default ProductIdeasPage; 