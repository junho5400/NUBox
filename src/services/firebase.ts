import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase web config is not secret; access is enforced by security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyCjhCbJ7VyecL4rYvQ8rWLdZFTU_pMFY4s',
  authDomain: 'nubox-58de7.firebaseapp.com',
  projectId: 'nubox-58de7',
  storageBucket: 'nubox-58de7.firebasestorage.app',
  messagingSenderId: '1002871695647',
  appId: '1:1002871695647:web:cfff01645b5807da81682a',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
