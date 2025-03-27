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

// Create a root reducer that handles logout
const createRootReducer = (reducers) => (state, action) => {
  if (action.type === 'auth/logoutUser/fulfilled') {
    // Reset all slices to their initial states
    state = undefined;
  }
  return reducers(state, action);
};

export const store = configureStore({
  reducer: createRootReducer((state, action) => {
    const newState = {};
    for (const [key, reducer] of Object.entries(combinedReducer)) {
      newState[key] = reducer(state?.[key], action);
    }
    return newState;
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});