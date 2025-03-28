import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { logSecurityEvent } from '../../utils/security';

// Fetch security alerts
export const fetchSecurityAlerts = createAsyncThunk(
  'security/fetchAlerts',
  async (userId) => {
    const q = query(
      collection(db, 'securityAlerts'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
);

// Create security alert
export const createSecurityAlert = createAsyncThunk(
  'security/createAlert',
  async ({ userId, alertData }) => {
    const docRef = await addDoc(collection(db, 'securityAlerts'), {
      userId,
      ...alertData,
      status: 'active',
      createdAt: new Date(),
    });

    await logSecurityEvent(userId, 'alert_created', alertData);

    return {
      id: docRef.id,
      userId,
      ...alertData,
    };
  }
);

// Dismiss security alert
export const dismissAlert = createAsyncThunk(
  'security/dismissAlert',
  async ({ alertId, userId }) => {
    const alertRef = doc(db, 'securityAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'dismissed',
      dismissedAt: new Date(),
    });

    await logSecurityEvent(userId, 'alert_dismissed', { alertId });

    return alertId;
  }
);

const securitySlice = createSlice({
  name: 'security',
  initialState: {
    alerts: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearAlerts: (state) => {
      state.alerts = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecurityAlerts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSecurityAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.alerts = action.payload;
      })
      .addCase(fetchSecurityAlerts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createSecurityAlert.fulfilled, (state, action) => {
        state.alerts.push(action.payload);
      })
      .addCase(dismissAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
      });
  },
});

export const { clearAlerts } = securitySlice.actions;
export default securitySlice.reducer;
