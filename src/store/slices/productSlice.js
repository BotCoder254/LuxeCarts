import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    try {
      // Only fetch active products with stock > 0
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'active'),
        where('stock', '>', 0),
        orderBy('stock', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    lastFetch: null,
  },
  reducers: {
    refreshProducts: (state) => {
      state.status = 'idle';
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { refreshProducts } = productSlice.actions;
export default productSlice.reducer; 