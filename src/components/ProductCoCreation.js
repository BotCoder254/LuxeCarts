import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiThumbsUp, FiMessageSquare, FiPlus, FiTrendingUp, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { collection, addDoc, updateDoc, doc, onSnapshot, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const ProductCoCreation = () => {
  const { user } = useSelector((state) => state.auth);
  const [productIdeas, setProductIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .slice(0, 3); // Get top 3 ideas by votes
            
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

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to submit product ideas');
      return;
    }

    if (!newIdea.trim() || !newDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const newIdeaObj = {
        title: newIdea,
        description: newDescription,
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
      setShowSubmitForm(false);
      toast.success('Your product idea has been submitted!');
    } catch (error) {
      console.error('Error submitting product idea:', error);
      toast.error('Failed to submit product idea');
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
      default:
        return null;
    }
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Product Co-Creation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Submit your product ideas or vote on existing ones. Help us build the products you want!
          </p>
        </motion.div>

        <div className="mt-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Popular Ideas
            </h3>
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FiPlus className="mr-2" /> Submit Idea
            </button>
          </div>

          {showSubmitForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-50 rounded-lg p-6 shadow-md"
            >
              <h4 className="text-lg font-semibold mb-4">Submit Your Product Idea</h4>
              <form onSubmit={handleSubmitIdea}>
                <div className="mb-4">
                  <label htmlFor="idea-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Idea Title
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
                    Description
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSubmitForm(false)}
                    className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {productIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{idea.title}</h4>
                      <p className="text-gray-600 mb-4">{idea.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">Submitted by {idea.submittedBy || 'Anonymous'}</span>
                        <span>on {idea.submittedDate || 'Unknown date'}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(idea.status)}
                        <button
                          onClick={() => handleVote(idea.id)}
                          className="flex items-center text-sm text-gray-700 hover:text-indigo-600"
                          disabled={user && idea.voters?.includes(user.uid)}
                        >
                          <FiThumbsUp className="mr-1" /> {idea.votes || 0}
                        </button>
                        <span className="flex items-center text-sm text-gray-700">
                          <FiMessageSquare className="mr-1" /> {idea.comments || 0}
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
          )}

          <div className="mt-12 text-center">
            <Link
              to="/product-ideas"
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              View All Ideas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCoCreation; 