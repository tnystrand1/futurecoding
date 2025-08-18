/**
 * Date utility functions for consistent timestamp handling across the application
 * Fixes "Invalid Date" issues in messaging system
 */

/**
 * Safely converts various timestamp formats to a JavaScript Date object
 * @param {*} timestamp - Can be Firestore timestamp, Date object, string, or number
 * @returns {Date|null} - Valid Date object or null if invalid
 */
export const safeTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }
    
    // Handle ISO strings
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle Unix timestamps (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Handle objects with seconds/nanoseconds (Firestore format)
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.warn('Error converting timestamp:', error, timestamp);
    return null;
  }
};

/**
 * Format timestamp for message display (relative time)
 * @param {*} timestamp - Any timestamp format
 * @returns {string} - Formatted time string
 */
export const formatMessageTimestamp = (timestamp) => {
  const date = safeTimestampToDate(timestamp);
  if (!date) return '';
  
  try {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting timestamp:', error, timestamp);
    return '';
  }
};

/**
 * Format timestamp for conversation list (short format)
 * @param {*} timestamp - Any timestamp format
 * @returns {string} - Formatted time string
 */
export const formatConversationTimestamp = (timestamp) => {
  const date = safeTimestampToDate(timestamp);
  if (!date) return '';
  
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      // Yesterday
      return 'Yesterday';
    } else if (now - date < 7 * 24 * 60 * 60 * 1000) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.warn('Error formatting conversation timestamp:', error, timestamp);
    return '';
  }
};

/**
 * Format timestamp for message bubble time display
 * @param {*} timestamp - Any timestamp format
 * @returns {string} - Formatted time string
 */
export const formatBubbleTimestamp = (timestamp) => {
  const date = safeTimestampToDate(timestamp);
  if (!date) return '';
  
  try {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.warn('Error formatting bubble timestamp:', error, timestamp);
    return '';
  }
};

/**
 * Check if two timestamps are from the same day
 * @param {*} timestamp1 - First timestamp
 * @param {*} timestamp2 - Second timestamp
 * @returns {boolean} - True if same day
 */
export const isSameDay = (timestamp1, timestamp2) => {
  const date1 = safeTimestampToDate(timestamp1);
  const date2 = safeTimestampToDate(timestamp2);
  
  if (!date1 || !date2) return false;
  
  return date1.toDateString() === date2.toDateString();
};

/**
 * Check if timestamp is from today
 * @param {*} timestamp - Any timestamp format
 * @returns {boolean} - True if today
 */
export const isToday = (timestamp) => {
  const date = safeTimestampToDate(timestamp);
  if (!date) return false;
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Get time difference in minutes between two timestamps
 * @param {*} timestamp1 - Earlier timestamp
 * @param {*} timestamp2 - Later timestamp
 * @returns {number} - Difference in minutes
 */
export const getTimeDifferenceInMinutes = (timestamp1, timestamp2) => {
  const date1 = safeTimestampToDate(timestamp1);
  const date2 = safeTimestampToDate(timestamp2);
  
  if (!date1 || !date2) return 0;
  
  return Math.abs(date2.getTime() - date1.getTime()) / 60000;
};

/**
 * Create a valid timestamp for new messages
 * @returns {Date} - Current date
 */
export const createCurrentTimestamp = () => {
  return new Date();
};
