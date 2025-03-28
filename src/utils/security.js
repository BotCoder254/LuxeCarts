import { doc, collection, addDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

// Risk factors for transaction scoring
const RISK_FACTORS = {
  NEW_DEVICE: 20,
  UNUSUAL_LOCATION: 25,
  LARGE_TRANSACTION: 30,
  MULTIPLE_ATTEMPTS: 35,
  RAPID_PURCHASES: 40,
};

// Calculate risk score for a transaction
export const calculateRiskScore = async (transaction, userId) => {
  if (!transaction || !userId) {
    return { score: 0, warnings: ['Invalid transaction data'] };
  }

  try {
    let riskScore = 0;
    const warnings = [];

    // Check for large transactions
    if (transaction.total > 1000) {
      riskScore += RISK_FACTORS.LARGE_TRANSACTION;
      warnings.push('Large transaction amount detected');
    }

    // Check for rapid purchases
    const recentOrders = await getRecentOrders(userId);
    if (recentOrders.length > 3) {
      riskScore += RISK_FACTORS.RAPID_PURCHASES;
      warnings.push('Multiple purchases in short time period');
    }

    // Add device and location checks
    const deviceInfo = await getDeviceInfo();
    if (deviceInfo.isNewDevice) {
      riskScore += RISK_FACTORS.NEW_DEVICE;
      warnings.push('New device detected');
    }

    if (deviceInfo.isUnusualLocation) {
      riskScore += RISK_FACTORS.UNUSUAL_LOCATION;
      warnings.push('Unusual location detected');
    }

    return { score: riskScore, warnings };
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return { score: 0, warnings: ['Error calculating risk score'] };
  }
};

// Log security event
export const logSecurityEvent = async (userId, eventType, details) => {
  if (!userId || !eventType) {
    console.error('Invalid security event data');
    return;
  }

  try {
    const timestamp = new Date();
    const deviceInfo = await getDeviceInfo();
    
    await addDoc(collection(db, 'securityLogs'), {
      userId,
      eventType,
      details,
      timestamp,
      deviceInfo,
      createdAt: timestamp,
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

// Get device information
export const getDeviceInfo = async () => {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error('Failed to fetch IP');
    }
    const { ip } = await response.json();
    
    const isNewDevice = await checkIfNewDevice(userAgent);
    const isUnusualLocation = await checkIfUnusualLocation(timezone);

    return {
      userAgent,
      language,
      timezone,
      ip,
      isNewDevice,
      isUnusualLocation,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      userAgent,
      language,
      timezone,
      isNewDevice: false,
      isUnusualLocation: false,
      timestamp: new Date(),
    };
  }
};

// Check if device is new
const checkIfNewDevice = async (userAgent) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) return false;

  const devicesRef = collection(db, 'userDevices');
  const q = query(
    devicesRef,
    where('userId', '==', user.uid),
    where('userAgent', '==', userAgent)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Log new device
    await addDoc(devicesRef, {
      userId: user.uid,
      userAgent,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
    return true;
  }

  // Update last seen
  const deviceDoc = snapshot.docs[0];
  await updateDoc(doc(devicesRef, deviceDoc.id), {
    lastSeen: new Date(),
  });

  return false;
};

// Check if location is unusual
const checkIfUnusualLocation = async (timezone) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) return false;

  const locationsRef = collection(db, 'userLocations');
  const q = query(
    locationsRef,
    where('userId', '==', user.uid),
    where('timezone', '==', timezone)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Log new location
    await addDoc(locationsRef, {
      userId: user.uid,
      timezone,
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
    return true;
  }

  // Update last seen
  const locationDoc = snapshot.docs[0];
  await updateDoc(doc(locationsRef, locationDoc.id), {
    lastSeen: new Date(),
  });

  return false;
};

// Get recent orders for rapid purchase detection
const getRecentOrders = async (userId) => {
  if (!userId) {
    console.error('Invalid user ID');
    return [];
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      where('createdAt', '>=', oneHourAgo)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting recent orders:', error);
    return [];
  }
};

// Check for suspicious email patterns
export const checkEmailRisk = async (email) => {
  if (!email) {
    console.error('Invalid email');
    return { risk: 'unknown', reason: 'Invalid email' };
  }

  try {
    const methods = await fetchSignInMethodsForEmail(getAuth(), email);
    if (methods.length > 0) {
      return { risk: 'high', reason: 'Email already in use' };
    }

    // Check for disposable email patterns
    const disposablePatterns = ['temp', 'disposable', '10minute'];
    if (disposablePatterns.some(pattern => email.toLowerCase().includes(pattern))) {
      return { risk: 'high', reason: 'Disposable email detected' };
    }

    return { risk: 'low', reason: 'No issues detected' };
  } catch (error) {
    console.error('Error checking email risk:', error);
    return { risk: 'unknown', reason: 'Error checking email' };
  }
};
