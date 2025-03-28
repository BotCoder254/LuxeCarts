import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Fetch active pricing rules
export const fetchPricingRules = createAsyncThunk(
  'pricing/fetchRules',
  async () => {
    const rulesRef = collection(db, 'pricingRules');
    const q = query(rulesRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
);

// Create new pricing rule
export const createPricingRule = createAsyncThunk(
  'pricing/createRule',
  async (ruleData) => {
    const docRef = await addDoc(collection(db, 'pricingRules'), {
      ...ruleData,
      createdAt: serverTimestamp(),
      isActive: true
    });
    
    return {
      id: docRef.id,
      ...ruleData
    };
  }
);

// Update pricing rule
export const updatePricingRule = createAsyncThunk(
  'pricing/updateRule',
  async ({ id, data }) => {
    const ruleRef = doc(db, 'pricingRules', id);
    await updateDoc(ruleRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return {
      id,
      ...data
    };
  }
);

// Delete pricing rule
export const deletePricingRule = createAsyncThunk(
  'pricing/deleteRule',
  async (id) => {
    await deleteDoc(doc(db, 'pricingRules', id));
    return id;
  }
);

// Calculate final price based on rules
export const calculatePrice = (basePrice, quantity, rules, userLocation) => {
  let finalPrice = basePrice;
  let appliedRules = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Check if rule is within valid time frame
    const now = new Date();
    if (rule.startDate && new Date(rule.startDate) > now) continue;
    if (rule.endDate && new Date(rule.endDate) < now) continue;

    // Apply bulk discount
    if (rule.type === 'bulk' && quantity >= rule.minQuantity) {
      const discount = rule.discountType === 'percentage' 
        ? basePrice * (rule.discountValue / 100)
        : rule.discountValue;
      finalPrice -= discount;
      appliedRules.push(rule);
    }

    // Apply location-based pricing
    if (rule.type === 'location' && rule.regions.includes(userLocation)) {
      const adjustment = rule.adjustmentType === 'percentage'
        ? basePrice * (rule.adjustmentValue / 100)
        : rule.adjustmentValue;
      finalPrice += adjustment;
      appliedRules.push(rule);
    }

    // Apply time-limited sale
    if (rule.type === 'sale') {
      const discount = rule.discountType === 'percentage'
        ? basePrice * (rule.discountValue / 100)
        : rule.discountValue;
      finalPrice -= discount;
      appliedRules.push(rule);
    }
  }

  return {
    finalPrice: Math.max(0, finalPrice),
    appliedRules
  };
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState: {
    rules: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingRules.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPricingRules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rules = action.payload;
      })
      .addCase(fetchPricingRules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createPricingRule.fulfilled, (state, action) => {
        state.rules.push(action.payload);
      })
      .addCase(updatePricingRule.fulfilled, (state, action) => {
        const index = state.rules.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules[index] = action.payload;
        }
      })
      .addCase(deletePricingRule.fulfilled, (state, action) => {
        state.rules = state.rules.filter(rule => rule.id !== action.payload);
      });
  }
});

export default pricingSlice.reducer;
