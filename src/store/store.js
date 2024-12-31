import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import favoriteReducer from './slices/favoriteSlice';

const combinedReducer = {
  products: productReducer,
  cart: cartReducer,
  auth: authReducer,
  favorites: favoriteReducer,
};

const rootReducer = (state, action) => {
  if (action.type === 'auth/logoutUser/fulfilled') {
    // Reset all slices to their initial states
    state = {};
  }
  return combinedReducer;
};

export const store = configureStore({
  reducer: combinedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 