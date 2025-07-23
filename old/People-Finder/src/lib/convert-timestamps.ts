/**
 * Recursively converts Firebase Timestamp objects to JavaScript Date objects
 * This is necessary when passing data from Server Components to Client Components
 */
export function convertTimestamps(obj: any): any {
  if (!obj) return obj;
  
  // Check if it's a Firebase Admin Timestamp (from server-side)
  // These have _seconds and _nanoseconds as properties
  if (typeof obj === 'object' && obj !== null) {
    // More lenient check for timestamp-like objects
    if ('_seconds' in obj && '_nanoseconds' in obj) {
      try {
        return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000);
      } catch (e) {
        console.error('Failed to convert timestamp:', obj, e);
        return obj;
      }
    }
    
    // Check if it has seconds and nanoseconds (without underscore)
    if ('seconds' in obj && 'nanoseconds' in obj) {
      try {
        return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
      } catch (e) {
        console.error('Failed to convert timestamp:', obj, e);
        return obj;
      }
    }
    
    // Check if it has a toDate method (Firestore Timestamp from client SDK)
    if (typeof obj.toDate === 'function') {
      try {
        return obj.toDate();
      } catch (e) {
        console.error('Failed to convert timestamp with toDate:', obj, e);
        return obj;
      }
    }
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }
  
  // Handle plain objects
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  // Return primitive values as-is
  return obj;
}