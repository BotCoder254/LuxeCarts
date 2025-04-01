import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiTrash2, FiUpload, FiImage, FiMove, FiSearch, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'banners'), (snapshot) => {
      const bannerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBanners(bannerData.sort((a, b) => a.order - b.order));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${unsplashQuery}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=20`
      );
      const data = await response.json();
      setUnsplashImages(data.results);
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      toast.error('Failed to search Unsplash images');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUnsplashSelect = async (image) => {
    try {
      setUploading(true);
      await addDoc(collection(db, 'banners'), {
        url: image.urls.regular,
        title: image.alt_description || 'New Banner',
        description: image.description || 'Add your description here',
        order: banners.length,
        unsplashId: image.id,
        photographer: image.user.name,
        photographerUrl: image.user.links.html,
        transitionDuration: 0.5
      });

      toast.success('Unsplash image added successfully');
      setShowUnsplashModal(false);
    } catch (error) {
      console.error('Error adding Unsplash image:', error);
      toast.error('Failed to add Unsplash image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'banners'), {
        url,
        title: 'New Banner',
        description: 'Add your description here',
        order: banners.length,
        storagePath: storageRef.fullPath,
        transitionDuration: 0.5
      });

      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (banner) => {
    try {
      if (banner.storagePath) {
        const storageRef = ref(storage, banner.storagePath);
        await deleteObject(storageRef);
      }
      await deleteDoc(doc(db, 'banners', banner.id));
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(banners);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBanners(items);

    try {
      const updates = items.map((item, index) =>
        updateDoc(doc(db, 'banners', item.id), { order: index })
      );
      await Promise.all(updates);
      toast.success('Banner order updated');
    } catch (error) {
      console.error('Error updating banner order:', error);
      toast.error('Failed to update banner order');
    }
  };

  const handleUpdateBanner = async (id, updates) => {
    try {
      await updateDoc(doc(db, 'banners', id), updates);
      toast.success('Banner updated successfully');
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner Manager</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowUnsplashModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <FiSearch />
            Search Unsplash
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
            <FiUpload />
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="banners">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {banners.map((banner, index) => (
                <Draggable
                  key={banner.id}
                  draggableId={banner.id}
                  index={index}
                >
                  {(provided) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow-md p-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-48 h-32 relative">
                          <img
                            src={banner.url}
                            alt={banner.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full cursor-move"
                          >
                            <FiMove className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Banner Title"
                          />
                          <textarea
                            value={banner.description}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, { description: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Banner Description"
                            rows="2"
                          />
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Transition Duration:</span>
                              <input
                                type="number"
                                value={banner.transitionDuration}
                                onChange={(e) =>
                                  handleUpdateBanner(banner.id, {
                                    transitionDuration: parseFloat(e.target.value) || 0.5
                                  })
                                }
                                className="w-20 px-2 py-1 border rounded-md"
                                step="0.1"
                                min="0.1"
                                max="2"
                              />
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                      {banner.photographer && (
                        <div className="mt-2 text-sm text-gray-500">
                          Photo by{' '}
                          <a
                            href={banner.photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {banner.photographer}
                          </a>
                          {' on Unsplash'}
                        </div>
                      )}
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {banners.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiImage className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No banners uploaded yet</p>
        </div>
      )}

      {/* Unsplash Modal */}
      {showUnsplashModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Search Unsplash Images</h2>
              <button
                onClick={() => setShowUnsplashModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={unsplashQuery}
                onChange={(e) => setUnsplashQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUnsplash()}
                placeholder="Search for images..."
                className="flex-1 px-4 py-2 border rounded-md"
              />
              <button
                onClick={searchUnsplash}
                disabled={searchLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {unsplashImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleUnsplashSelect(image)}
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <FiPlus className="w-8 h-8 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BannerManager; 
