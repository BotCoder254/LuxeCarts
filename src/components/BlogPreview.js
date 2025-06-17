import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiArrowRight, FiUser } from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const BlogPreview = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use a simpler query without complex indexes
    const fetchPosts = async () => {
      try {
        // Simple query with just one condition
        const q = query(
          collection(db, 'blogPosts'),
          where('published', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Process the data client-side instead
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side
        const sortedPosts = postsData.sort((a, b) => {
          // Handle missing dates
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        // Limit to 3 posts client-side
        setPosts(sortedPosts.slice(0, 3));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Invalid date format:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Latest from our Blog</h2>
          <p className="mt-4 text-xl text-gray-600">Loading latest posts...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden h-96 animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">Our Blog</span>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">Latest from our Blog</h2>
        <p className="mt-4 text-xl text-gray-600">
          Insights, tips, and trends from our experts
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="h-48 overflow-hidden">
              <img
                src={post.imageUrl || ''}
                alt={post.title || 'Blog post'}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span className="flex items-center">
                  <FiCalendar className="mr-1" /> {formatDate(post.createdAt)}
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <FiUser className="mr-1" /> {post.author || 'Admin'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {post.title || 'Untitled Post'}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {post.summary || ''}
              </p>
              <Link
                to={`/blog/${post.id}`}
                className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                Read More <FiArrowRight className="ml-1" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/blog"
          className="inline-flex items-center px-6 py-3 border border-indigo-600 text-indigo-600 font-medium rounded-md hover:bg-indigo-600 hover:text-white transition-colors"
        >
          View All Posts <FiArrowRight className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default BlogPreview; 