import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { ROLES, DEFAULT_ROLE } from '../../config/roles';
import { initializeUserDocument } from '../../utils/initializeCollections';

// Helper function to create/update user document
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;

  const { uid, email, displayName, photoURL } = user;
  
  // Use the initializeUserDocument function to create or update the user document
  const userData = {
    uid,
    email,
    displayName: displayName || additionalData.displayName,
    photoURL,
    role: DEFAULT_ROLE,
    updatedAt: serverTimestamp(),
    ...additionalData,
  };
  
  await initializeUserDocument(uid, userData);

  // Return the user document
  const userSnap = await getDoc(doc(db, 'users', uid));
  return { uid, ...userSnap.data() };
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, displayName }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData = await createUserDocument(userCredential.user, { displayName });
    return userData;
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    // If user document doesn't exist or is missing fields, initialize it
    if (!userDoc.exists()) {
      return createUserDocument(userCredential.user);
    }
    
    return { uid: userCredential.user.uid, ...userDoc.data() };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await signOut(auth);
  // Clear other slices
  dispatch({ type: 'cart/clearCart' });
  dispatch({ type: 'favorites/clearFavorites' });
  dispatch({ type: 'products/refreshProducts' });
});

export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userData = await createUserDocument(result.user);
    return userData;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(googleAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setUser, logout } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === ROLES.ADMIN;

export default authSlice.reducer; 
