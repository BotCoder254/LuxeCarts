import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiSearch, FiFilter } from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [visiblePosts, setVisiblePosts] = useState(6);

  const POSTS_PER_PAGE = 6;

  useEffect(() => {
    // Fetch all posts once and manage filtering/pagination client-side
    const fetchAllPosts = async () => {
      try {
        setLoading(true);
        // Simple query with just one condition
        const q = query(
          collection(db, 'blogPosts'),
          where('published', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Extract all posts
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side by createdAt date
        const sortedPosts = postsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        
        setAllPosts(sortedPosts);
        
        // Extract categories
        const categoriesMap = {};
        sortedPosts.forEach(post => {
          if (post.category) {
            categoriesMap[post.category] = true;
          }
        });
        
        setCategories(Object.keys(categoriesMap));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setLoading(false);
      }
    };
    
    fetchAllPosts();
  }, []);

  // Filter posts based on category and search term
  useEffect(() => {
    let filteredPosts = [...allPosts];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.category === selectedCategory);
    }
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        (post.title?.toLowerCase().includes(searchTermLower)) || 
        (post.content?.toLowerCase().includes(searchTermLower)) ||
        (post.summary?.toLowerCase().includes(searchTermLower))
      );
    }
    
    setPosts(filteredPosts);
    setVisiblePosts(POSTS_PER_PAGE);
    setHasMore(filteredPosts.length > POSTS_PER_PAGE);
  }, [allPosts, selectedCategory, searchTerm]);

  const handleLoadMore = () => {
    const newVisibleCount = visiblePosts + POSTS_PER_PAGE;
    setVisiblePosts(newVisibleCount);
    setHasMore(newVisibleCount < posts.length);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

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

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
              Our Blog
            </h1>
            <p className="mt-4 text-xl text-indigo-100">
              Insights, tips, and trends from our experts
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
          
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {searchTerm && (
          <div className="mt-4 flex items-center">
            <span className="text-gray-600">
              Search results for: <span className="font-semibold">{searchTerm}</span>
            </span>
            <button
              onClick={clearSearch}
              className="ml-4 text-indigo-600 hover:text-indigo-800"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
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
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700">No posts found</h2>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(0, visiblePosts).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={post.imageUrl || ''}
                      alt={post.title || 'Blog post'}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-2 py-1 m-2 rounded">
                      {getCategoryName(post.category)}
                    </div>
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
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.summary || ''}
                    </p>
                    <Link
                      to={`/blog/${post.id}`}
                      className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                    >
                      Read More →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Load More Articles
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Subscribe to our Newsletter
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Get the latest articles, tips, and trends delivered straight to your inbox.
            </p>
            <form className="mt-8 max-w-xl mx-auto">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-l-md border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-r-md hover:bg-indigo-700"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog; 