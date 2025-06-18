import { collection, getDocs, addDoc, query, limit, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Initializes collections in Firebase if they don't exist
 * This ensures that the app has some data to display even if no real data has been added yet
 */
export const initializeCollections = async () => {
  try {
    // Check if communities collection exists and has data
    const communitiesRef = collection(db, 'communities');
    const communitiesQuery = query(communitiesRef, limit(1));
    const communitiesSnapshot = await getDocs(communitiesQuery);
    
    // If communities collection is empty, add sample data
    if (communitiesSnapshot.empty) {
      const communitiesSampleData = [
        {
          name: 'Gaming Gear Enthusiasts',
          category: 'Electronics',
          members: 1250,
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          description: 'Discuss the latest gaming peripherals and setups',
          featured: true,
          createdAt: new Date().toISOString().split('T')[0],
          topics: 42,
          posts: 356,
          memberIds: [],
        },
        {
          name: 'Smart Home Innovators',
          category: 'Electronics',
          members: 876,
          image: 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          description: 'Share your smart home configurations and tips',
          featured: true,
          createdAt: new Date().toISOString().split('T')[0],
          topics: 28,
          posts: 213,
          memberIds: [],
        },
        {
          name: 'Fashion Forward',
          category: 'Fashion',
          members: 2340,
          image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          description: 'Trending styles and fashion advice',
          featured: true,
          createdAt: new Date().toISOString().split('T')[0],
          topics: 67,
          posts: 589,
          memberIds: [],
        },
        {
          name: 'Home Decor Dreams',
          category: 'Home & Living',
          members: 1890,
          image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
          description: 'Interior design ideas and inspiration',
          featured: false,
          createdAt: new Date().toISOString().split('T')[0],
          topics: 53,
          posts: 412,
          memberIds: [],
        },
      ];
      
      for (const community of communitiesSampleData) {
        await addDoc(communitiesRef, community);
      }
      console.log('Initialized communities collection with sample data');
    }
    
    // Check if productIdeas collection exists and has data
    const ideasRef = collection(db, 'productIdeas');
    const ideasQuery = query(ideasRef, limit(1));
    const ideasSnapshot = await getDocs(ideasQuery);
    
    // If productIdeas collection is empty, add sample data
    if (ideasSnapshot.empty) {
      const ideasSampleData = [
        {
          title: 'Eco-friendly Smart Water Bottle',
          description: 'A water bottle that tracks hydration and has biodegradable components',
          votes: 342,
          comments: 28,
          status: 'voting',
          submittedBy: 'eco_enthusiast',
          submittedDate: new Date().toISOString().split('T')[0],
          category: 'Electronics',
          voters: [],
          createdAt: new Date(),
        },
        {
          title: 'Modular Gaming Controller',
          description: 'Customizable controller with swappable components for different game genres',
          votes: 567,
          comments: 45,
          status: 'development',
          submittedBy: 'gamer_pro',
          submittedDate: new Date().toISOString().split('T')[0],
          category: 'Electronics',
          voters: [],
          createdAt: new Date(),
        },
        {
          title: 'Multi-functional Desk Organizer',
          description: 'Desk organizer with built-in wireless charging and smart storage solutions',
          votes: 289,
          comments: 19,
          status: 'voting',
          submittedBy: 'office_ninja',
          submittedDate: new Date().toISOString().split('T')[0],
          category: 'Home & Living',
          voters: [],
          createdAt: new Date(),
        },
        {
          title: 'Sustainable Yoga Mat with Alignment Guides',
          description: 'Eco-friendly yoga mat with built-in alignment markers and posture guidance',
          votes: 421,
          comments: 32,
          status: 'completed',
          submittedBy: 'yoga_master',
          submittedDate: new Date().toISOString().split('T')[0],
          category: 'Sports',
          voters: [],
          createdAt: new Date(),
        },
      ];
      
      for (const idea of ideasSampleData) {
        await addDoc(ideasRef, idea);
      }
      console.log('Initialized productIdeas collection with sample data');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    return false;
  }
};

/**
 * Initialize user document when a new user signs up
 * @param {string} userId - Firebase Auth user ID
 * @param {object} userData - User data from Firebase Auth
 */
export const initializeUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document with default fields
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        joinedCommunities: [],
        likedProductIdeas: [],
        role: 'user',
        settings: {
          notifications: true,
          newsletter: false,
          darkMode: false
        }
      });
      
      console.log(`User document created for ${userId}`);
    } else {
      // Update existing user document with any missing fields
      const existingData = userSnap.data();
      const updates = {};
      
      if (!existingData.joinedCommunities) updates.joinedCommunities = [];
      if (!existingData.likedProductIdeas) updates.likedProductIdeas = [];
      if (!existingData.settings) {
        updates.settings = {
          notifications: true,
          newsletter: false,
          darkMode: false
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await setDoc(userRef, updates, { merge: true });
        console.log(`User document updated for ${userId}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user document:', error);
    return false;
  }
}; 