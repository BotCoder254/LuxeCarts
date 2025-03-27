import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { throttle } from 'lodash';

// Throttle the interaction tracking to prevent too many writes
const trackInteraction = throttle(async (userId, interactionData) => {
  if (!userId) return;

  try {
    const interaction = {
      userId,
      ...interactionData,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'interactions'), interaction);
  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
}, 1000); // Throttle to one write per second

export const setupInteractionTracking = (userId) => {
  if (!userId) return;

  const handleMouseMove = (e) => {
    // Convert pixel coordinates to percentage
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);

    trackInteraction(userId, {
      type: 'mousemove',
      x,
      y,
    });
  };

  const handleClick = (e) => {
    const x = Math.round((e.clientX / window.innerWidth) * 100);
    const y = Math.round((e.clientY / window.innerHeight) * 100);

    trackInteraction(userId, {
      type: 'click',
      x,
      y,
      target: e.target.tagName.toLowerCase(),
      path: e.target.getAttribute('href') || '',
    });
  };

  // Add event listeners
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('click', handleClick);

  // Return cleanup function
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('click', handleClick);
  };
};

export default trackInteraction;
