import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiThumbsUp, FiMessageSquare, FiArrowLeft, FiSend, FiCalendar, FiUser, FiEdit, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc, arrayUnion, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const ProductIdeaDetailPage = () => {
  const { ideaId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [productIdea, setProductIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const fetchProductIdea = async () => {
      try {
        // Get product idea details
        const productIdeaRef = doc(db, 'productIdeas', ideaId);
        const productIdeaSnap = await getDoc(productIdeaRef);
        
        if (productIdeaSnap.exists()) {
          setProductIdea({
            id: productIdeaSnap.id,
            ...productIdeaSnap.data()
          });
        } else {
          toast.error('Product idea not found');
          navigate('/product-ideas');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product idea:', error);
        toast.error('Failed to load product idea');
        setLoading(false);
      }
    };
    
    fetchProductIdea();
    
    // Set up listener for comments
    if (ideaId) {
      const commentsRef = collection(db, 'productIdeas', ideaId, 'comments');
      
      const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        const commentsData = snapshot.docs
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
          
        setComments(commentsData);
        setLoadingComments(false);
      }, (error) => {
        console.error("Error fetching comments:", error);
        setLoadingComments(false);
        
        // Fallback to empty array if Firebase fetch fails
        setComments([]);
      });
      
      return () => unsubscribe();
    }
  }, [ideaId, navigate]);

  const handleVote = async () => {
    if (!user) {
      toast.error('Please log in to vote for product ideas');
      return;
    }

    try {
      // Check if user has already voted
      if (productIdea.voters?.includes(user.uid)) {
        toast.error('You have already voted for this idea');
        return;
      }
      
      // Update vote count in Firestore
      const ideaRef = doc(db, 'productIdeas', ideaId);
      
      await updateDoc(ideaRef, {
        votes: increment(1),
        voters: arrayUnion(user.uid)
      });
      
      // Update local state
      setProductIdea({
        ...productIdea,
        votes: (productIdea.votes || 0) + 1,
        voters: [...(productIdea.voters || []), user.uid]
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
      await addDoc(collection(db, 'productIdeas', ideaId, 'comments'), commentData);
      
      // Update comment count
      await updateDoc(doc(db, 'productIdeas', ideaId), {
        comments: increment(1)
      });
      
      // Update local state
      setProductIdea({
        ...productIdea,
        comments: (productIdea.comments || 0) + 1
      });
      
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      toast.error('Please log in to delete comments');
      return;
    }

    const comment = comments.find(c => c.id === commentId);
    if (comment.userId !== user.uid) {
      toast.error('You can only delete your own comments');
      return;
    }

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        // Delete comment from Firestore
        await deleteDoc(doc(db, 'productIdeas', ideaId, 'comments', commentId));
        
        // Update comment count
        await updateDoc(doc(db, 'productIdeas', ideaId), {
          comments: increment(-1)
        });
        
        // Update local state
        setProductIdea({
          ...productIdea,
          comments: Math.max((productIdea.comments || 0) - 1, 0)
        });
        
        toast.success('Comment deleted');
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleDeleteIdea = async () => {
    if (!user || (user.uid !== productIdea.submittedById)) {
      toast.error('You can only delete your own ideas');
      return;
    }

    if (productIdea.status !== 'voting') {
      toast.error('You can only delete ideas that are still in the voting stage');
      return;
    }

    if (window.confirm('Are you sure you want to delete this product idea?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'productIdeas', ideaId));
        toast.success('Product idea deleted successfully');
        navigate('/my-product-ideas');
      } catch (error) {
        console.error('Error deleting product idea:', error);
        toast.error('Failed to delete product idea');
      }
    }
  };

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

  if (loading) {
    return (
      <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!productIdea) {
    return (
      <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Product idea not found</h3>
            <Link to="/product-ideas" className="text-indigo-600 hover:text-indigo-800">
              Return to Product Ideas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/product-ideas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <FiArrowLeft className="mr-2" /> Back to Product Ideas
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-3">{productIdea.title}</h1>
                  {getStatusBadge(productIdea.status)}
                </div>
                
                <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4 gap-4">
                  <div className="flex items-center">
                    <FiUser className="mr-1" />
                    Submitted by {productIdea.submittedBy || 'Anonymous'}
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" />
                    {formatDate(productIdea.createdAt) || productIdea.submittedDate || 'Unknown date'}
                  </div>
                  {productIdea.category && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      {productIdea.category}
                    </span>
                  )}
                </div>
              </div>
              
              {user && user.uid === productIdea.submittedById && productIdea.status === 'voting' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/edit-product-idea/${productIdea.id}`)}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Edit idea"
                  >
                    <FiEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDeleteIdea}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete idea"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700 whitespace-pre-line">{productIdea.description}</p>
            </div>
            
            <div className="flex items-center space-x-6 mb-4">
              <button
                onClick={handleVote}
                disabled={!user || productIdea.voters?.includes(user.uid)}
                className={`flex items-center px-4 py-2 rounded-md ${
                  user && productIdea.voters?.includes(user.uid)
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiThumbsUp className="mr-2" /> {productIdea.votes || 0} votes
              </button>
              
              <div className="flex items-center text-gray-700">
                <FiMessageSquare className="mr-2" /> {productIdea.comments || 0} comments
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
          
          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex items-start">
                <div className="min-w-0 flex-1">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your comment..."
                    className="block w-full rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 p-2"
                  />
                </div>
                <div className="ml-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FiSend className="mr-2" /> Post
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 bg-indigo-50 p-4 rounded-md text-center">
              <p className="text-indigo-800 mb-2">Please log in to add a comment</p>
              <Link
                to="/login"
                className="inline-block text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Log In
              </Link>
            </div>
          )}
          
          {/* Comments List */}
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex justify-between">
                    <div className="flex items-start mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-3">
                        {comment.userPhotoURL ? (
                          <img src={comment.userPhotoURL} alt={comment.userName} className="w-10 h-10 rounded-full" />
                        ) : (
                          comment.userName?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                      </div>
                    </div>
                    
                    {user && user.uid === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete comment"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mt-2 whitespace-pre-line">{comment.text}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No comments yet</h3>
              <p className="text-gray-500">Be the first to comment on this product idea</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductIdeaDetailPage; 