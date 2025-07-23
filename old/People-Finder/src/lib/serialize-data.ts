/**
 * Ensures data is serializable for passing from Server to Client Components
 * Converts all non-serializable objects (Timestamps, etc.) to serializable formats
 */
export function serializeData(obj: any): any {
  if (!obj) return obj;
  
  // Handle Firebase Timestamps
  if (typeof obj === 'object' && obj !== null) {
    // Firebase Admin Timestamp
    if ('_seconds' in obj && '_nanoseconds' in obj) {
      return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000).toISOString();
    }
    
    // Alternative timestamp format
    if ('seconds' in obj && 'nanoseconds' in obj) {
      return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
    }
    
    // Check if it has a toDate method
    if (typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
    }
    
    // Check if it's already a Date object
    if (obj instanceof Date) {
      return obj.toISOString();
    }
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }
  
  // Handle plain objects
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeData(obj[key]);
      }
    }
    return serialized;
  }
  
  // Return primitive values as-is
  return obj;
}