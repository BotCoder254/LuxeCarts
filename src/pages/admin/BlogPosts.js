import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FiTrash2, FiUpload, FiEdit, FiPlus, FiCalendar, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';

const BlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    summary: '',
    content: '',
    author: '',
    category: 'news',
    imageUrl: '',
    published: true
  });

  const categories = [
    { id: 'news', name: 'News & Updates' },
    { id: 'tips', name: 'Tips & Tricks' },
    { id: 'trends', name: 'Fashion Trends' },
    { id: 'guides', name: 'Buying Guides' },
    { id: 'reviews', name: 'Product Reviews' }
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'blogPosts'), (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));
      setPosts(postsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `blogImages/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setNewPost({
        ...newPost,
        imageUrl: url,
        storagePath: storageRef.fullPath
      });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content || !newPost.imageUrl) {
      toast.error('Please fill all required fields and upload an image');
      return;
    }

    try {
      setUploading(true);
      
      const postData = {
        title: newPost.title,
        summary: newPost.summary,
        content: newPost.content,
        author: newPost.author || 'Admin',
        category: newPost.category,
        imageUrl: newPost.imageUrl,
        storagePath: newPost.storagePath,
        published: newPost.published,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingPost) {
        await updateDoc(doc(db, 'blogPosts', editingPost.id), postData);
        toast.success('Blog post updated successfully');
      } else {
        await addDoc(collection(db, 'blogPosts'), postData);
        toast.success('Blog post added successfully');
      }

      setShowAddModal(false);
      setEditingPost(null);
      setNewPost({
        title: '',
        summary: '',
        content: '',
        author: '',
        category: 'news',
        imageUrl: '',
        published: true
      });
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error('Failed to save blog post');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (post) => {
    try {
      if (post.storagePath) {
        const storageRef = ref(storage, post.storagePath);
        await deleteObject(storageRef);
      }
      await deleteDoc(doc(db, 'blogPosts', post.id));
      toast.success('Blog post deleted successfully');
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title || '',
      summary: post.summary || '',
      content: post.content || '',
      author: post.author || '',
      category: post.category || 'news',
      imageUrl: post.imageUrl || '',
      storagePath: post.storagePath || '',
      published: post.published !== undefined ? post.published : true
    });
    setShowAddModal(true);
  };

  const handleTogglePublished = async (post) => {
    try {
      await updateDoc(doc(db, 'blogPosts', post.id), {
        published: !post.published
      });
      toast.success(`Blog post ${!post.published ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
    }
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
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Blog Posts Manager</h1>
          <button
            onClick={() => {
              setEditingPost(null);
              setNewPost({
                title: '',
                summary: '',
                content: '',
                author: '',
                category: 'news',
                imageUrl: '',
                published: true
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <FiPlus />
            Add New Post
          </button>
        </div>

        {/* Blog Posts List */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <FiEdit className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No Blog Posts Yet</h3>
              <p className="text-gray-500 mt-2">Create your first blog post to engage with your customers!</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Blog Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <img
                      src={typeof post.imageUrl === 'string' ? post.imageUrl : ''}
                      alt={typeof post.title === 'string' ? post.title : 'Blog post'}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold ${post.published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {post.published ? 'Published' : 'Draft'}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <div className="text-white text-xs font-medium uppercase tracking-wide">
                        {typeof post.category === 'string' 
                          ? (categories.find(c => c.id === post.category)?.name || post.category)
                          : 'Uncategorized'}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{typeof post.title === 'string' ? post.title : ''}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          By {typeof post.author === 'string' ? post.author : 'Unknown'} • {formatDate(post.createdAt)}
                        </p>
                        <p className="text-gray-600 mt-3 line-clamp-3">{typeof post.summary === 'string' ? post.summary : ''}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTogglePublished(post)}
                          className={`p-2 rounded-md ${post.published ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}
                          title={post.published ? 'Unpublish' : 'Publish'}
                        >
                          {post.published ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 bg-indigo-100 text-indigo-600 rounded-md"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-2 bg-red-100 text-red-600 rounded-md"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {typeof post.content === 'string' 
                          ? (post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content)
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Blog Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title*
                      </label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Enter post title"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Summary*
                      </label>
                      <textarea
                        value={newPost.summary}
                        onChange={(e) => setNewPost({...newPost, summary: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        rows="3"
                        placeholder="Brief summary of your post"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Author
                        </label>
                        <input
                          type="text"
                          value={newPost.author}
                          onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Author name"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newPost.category}
                          onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Featured Image*
                      </label>
                      {newPost.imageUrl ? (
                        <div className="relative h-40 mb-2">
                          <img
                            src={newPost.imageUrl}
                            alt="Blog Post Featured Image"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            onClick={() => setNewPost({...newPost, imageUrl: '', storagePath: ''})}
                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                          <div className="text-center">
                            <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="mt-2 block text-sm font-medium text-gray-700">
                              {uploading ? 'Uploading...' : 'Upload an image'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="published"
                        checked={newPost.published}
                        onChange={(e) => setNewPost({...newPost, published: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                        Publish immediately
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content*
                      </label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        rows="20"
                        placeholder="Write your blog post content here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPost}
                    disabled={uploading || !newPost.title || !newPost.content || !newPost.imageUrl}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Saving...' : editingPost ? 'Update Post' : 'Save Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BlogPosts; 