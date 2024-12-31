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

// Helper function to create/update user document
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { email, displayName, photoURL } = user;
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName: displayName || additionalData.displayName,
        photoURL,
        role: DEFAULT_ROLE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData,
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  // Return the user document
  const updatedUserSnap = await getDoc(userRef);
  return { uid: user.uid, ...updatedUserSnap.data() };
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

export const { setUser } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === ROLES.ADMIN;

export default authSlice.reducer; 
