import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiArrowLeft, FiShare2, FiMessageSquare } from 'react-icons/fi';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postDoc = await getDoc(doc(db, 'blogPosts', id));
        
        if (postDoc.exists()) {
          const postData = { id: postDoc.id, ...postDoc.data() };
          setPost(postData);
          
          // Fetch all published posts and filter client-side
          if (postData.category) {
            const q = query(
              collection(db, 'blogPosts'),
              where('published', '==', true)
            );
            
            const querySnapshot = await getDocs(q);
            const allPosts = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Filter related posts client-side
            const related = allPosts
              .filter(p => p.id !== id && p.category === postData.category)
              .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
              })
              .slice(0, 3);
            
            setRelatedPosts(related);
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

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

  const getCategoryName = (categoryId) => {
    if (!categoryId) return '';
    
    const categoryMap = {
      'news': 'News & Updates',
      'tips': 'Tips & Tricks',
      'trends': 'Fashion Trends',
      'guides': 'Buying Guides',
      'reviews': 'Product Reviews'
    };
    
    return categoryMap[categoryId] || categoryId;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Blog post not found</h2>
        <p className="mt-4 text-gray-600">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link to="/blog" className="mt-6 inline-flex items-center text-indigo-600 hover:text-indigo-800">
          <FiArrowLeft className="mr-2" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96">
        <div className="absolute inset-0">
          <img
            src={post.imageUrl || ''}
            alt={post.title || 'Blog post'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
              {getCategoryName(post.category)}
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {post.title || 'Untitled Post'}
            </h1>
            <div className="flex items-center text-white">
              <span className="flex items-center">
                <FiUser className="mr-1" /> {post.author || 'Admin'}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <FiCalendar className="mr-1" /> {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-lg max-w-none"
        >
          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-indigo-600">
            <p className="text-lg text-gray-700 italic">
              {post.summary || ''}
            </p>
          </div>

          {/* Main Content */}
          <div className="whitespace-pre-wrap">
            {(post.content || '').split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ) : <br key={index} />
            ))}
          </div>
        </motion.div>

        {/* Share and Comment Section */}
        <div className="mt-12 border-t border-b border-gray-200 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-medium text-gray-900">Share this article</h3>
              <div className="flex space-x-4 mt-2">
                <button className="text-gray-500 hover:text-indigo-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-indigo-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-indigo-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800"
            >
              <FiArrowLeft className="mr-2" /> Back to Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={relatedPost.imageUrl || ''}
                      alt={relatedPost.title || 'Related post'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {relatedPost.title || 'Untitled Post'}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">
                      {relatedPost.summary || ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail; 