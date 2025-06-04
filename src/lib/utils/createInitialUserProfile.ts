import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import type { User } from 'firebase/auth';

export const createInitialUserProfile = async (user: User) => {
  try {
    if (!user.uid) throw new Error('No user ID provided');

    const userRef = doc(db, 'users', user.uid);
    
    // Crear el documento inicial del usuario
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '/default-avatar-icon.png',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      bio: '',
      location: '',
    });

    return true;
  } catch (error) {
    console.error('Error creating initial user profile:', error);
    throw error;
  }
}; 