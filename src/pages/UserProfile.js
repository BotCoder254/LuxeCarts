import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { doc, updateDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { setUser } from '../store/slices/authSlice';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiCamera, FiUsers, FiZap, FiThumbsUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { inputStyles } from '../styles/commonStyles';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [userIdeas, setUserIdeas] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
    bio: user?.bio || '',
  });

  // Fetch user's joined communities
  useEffect(() => {
    if (user) {
      const fetchJoinedCommunities = async () => {
        setLoadingCommunities(true);
        try {
          // Get user's joined communities IDs
          const userRef = doc(db, 'users', user.uid);
          const unsubscribe = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const joinedCommunityIds = userData.joinedCommunities || [];
              
              if (joinedCommunityIds.length === 0) {
                setJoinedCommunities([]);
                setLoadingCommunities(false);
                return;
              }
              
              // Get community details for each ID
              const communitiesRef = collection(db, 'communities');
              const communitiesSnap = await getDocs(communitiesRef);
              
              const communitiesData = communitiesSnap.docs
                .filter(doc => joinedCommunityIds.includes(doc.id))
                .map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
              
              setJoinedCommunities(communitiesData);
              setLoadingCommunities(false);
            } else {
              setJoinedCommunities([]);
              setLoadingCommunities(false);
            }
          });
          
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching joined communities:', error);
          setJoinedCommunities([]);
          setLoadingCommunities(false);
        }
      };
      
      fetchJoinedCommunities();
    }
  }, [user]);

  // Fetch user's product ideas
  useEffect(() => {
    if (user) {
      const fetchUserIdeas = async () => {
        setLoadingIdeas(true);
        try {
          const ideasRef = collection(db, 'productIdeas');
          const q = query(ideasRef, where('submittedById', '==', user.uid));
          
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const ideasData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setUserIdeas(ideasData);
            setLoadingIdeas(false);
          }, (error) => {
            console.error('Error fetching user ideas:', error);
            setUserIdeas([]);
            setLoadingIdeas(false);
          });
          
          return () => unsubscribe();
        } catch (error) {
          console.error('Error setting up ideas listener:', error);
          setUserIdeas([]);
          setLoadingIdeas(false);
        }
      };
      
      fetchUserIdeas();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
      });

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: new Date(),
      });

      // Update Redux state
      dispatch(setUser({
        ...user,
        ...formData,
      }));

      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `profile-images/${user.uid}/${file.name}`);
      
      // Upload file
      await uploadBytes(fileRef, file);
      
      // Get download URL
      const photoURL = await getDownloadURL(fileRef);
      
      // Update auth profile
      await updateProfile(auth.currentUser, {
        photoURL: photoURL
      });

      // Update user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: photoURL,
        updatedAt: new Date(),
      });

      // Update Redux state
      dispatch(setUser({
        ...user,
        photoURL: photoURL,
      }));

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error updating profile picture');
    }
  };

  const renderProfileContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className={inputStyles.label}>Full Name</label>
          {editing ? (
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className={inputStyles.base}
            />
          ) : (
            <div className={inputStyles.detailsText}>
              {formData.displayName || 'Not provided'}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className={inputStyles.label}>Email Address</label>
          <div className={inputStyles.detailsText}>
            {formData.email}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className={inputStyles.label}>Phone Number</label>
          {editing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputStyles.base}
            />
          ) : (
            <div className={inputStyles.detailsText}>
              {formData.phone || 'Not provided'}
            </div>
          )}
        </div>

        {/* Address */}
        <div>
          <label className={inputStyles.label}>Address</label>
          {editing ? (
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={inputStyles.textarea}
            />
          ) : (
            <div className={inputStyles.detailsText}>
              {formData.address || 'Not provided'}
            </div>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={!editing}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            disabled={!editing}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            disabled={!editing}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            disabled={!editing}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          disabled={!editing}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
        />
      </div>

      {editing && (
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setFormData({
                displayName: user?.displayName || '',
                email: user?.email || '',
                phone: user?.phone || '',
                address: user?.address || '',
                city: user?.city || '',
                state: user?.state || '',
                zipCode: user?.zipCode || '',
                country: user?.country || '',
                bio: user?.bio || '',
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );

  const renderCommunitiesContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Communities</h2>
        <Link
          to="/communities"
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Browse All Communities
        </Link>
      </div>
      
      {loadingCommunities ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : joinedCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {joinedCommunities.map(community => (
            <div key={community.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="h-32 bg-gray-200 relative">
                <img
                  src={community.image || 'https://via.placeholder.com/300x150'}
                  alt={community.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x150';
                  }}
                />
                {community.featured && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                    Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{community.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{community.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {community.category || 'General'}
                  </span>
                  <Link
                    to={`/community/${community.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Community
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No communities joined yet</h3>
          <p className="mt-1 text-sm text-gray-500">Join communities to connect with other users and discuss products</p>
          <div className="mt-6">
            <Link
              to="/communities"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Communities
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const renderIdeasContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Product Ideas</h2>
        <Link
          to="/product-ideas"
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Browse All Ideas
        </Link>
      </div>
      
      {loadingIdeas ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : userIdeas.length > 0 ? (
        <div className="space-y-4">
          {userIdeas.map(idea => (
            <div key={idea.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  idea.status === 'voting' ? 'bg-blue-100 text-blue-800' :
                  idea.status === 'development' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{idea.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-500">
                    <FiThumbsUp className="mr-1" /> {idea.votes || 0} votes
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    <FiZap className="mr-1" /> {idea.comments || 0} comments
                  </span>
                </div>
                <Link
                  to={`/product-ideas#${idea.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FiZap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No product ideas submitted yet</h3>
          <p className="mt-1 text-sm text-gray-500">Submit your ideas to help shape our future products</p>
          <div className="mt-6">
            <Link
              to="/product-ideas"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Submit an Idea
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-500">
            <div className="absolute -bottom-12 left-8">
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                    <FiUser className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={inputStyles.fileInput}
                  />
                  <FiCamera className="w-6 h-6 text-gray-600" />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.displayName || 'My Profile'}
              </h1>
              {!editing && activeTab === 'profile' && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('communities')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'communities'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Communities
                </button>
                <button
                  onClick={() => setActiveTab('ideas')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ideas'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Product Ideas
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && renderProfileContent()}
            {activeTab === 'communities' && renderCommunitiesContent()}
            {activeTab === 'ideas' && renderIdeasContent()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfile; 