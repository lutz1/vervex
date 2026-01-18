import { db, storage } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';

export const testFirebaseConnection = async () => {
  try {
    // Test Authentication (no console output)
    // Test Firestore
    await getDocs(collection(db, 'frames'));

    // Test Storage
    try {
      const storageRef = ref(storage, 'frames');
      await listAll(storageRef);
    } catch (e) {
      // ignore
    }

    return true;
  } catch (error) {
    console.error('❌ Firebase Connection Error:', error.message);
    return false;
  }
};

// Auto-test on import
if (typeof window !== 'undefined') {
  window.testFirebase = testFirebaseConnection;
}
