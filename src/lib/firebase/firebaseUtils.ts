import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  FieldValue
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User } from 'firebase/auth';

// Auth functions
export const logoutUser = () => signOut(auth);

// Función para crear el perfil inicial del usuario
export const createInitialUserProfile = async (user: any) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Asegurarnos de guardar la foto de Google si existe
      const photoURL = user.photoURL || '/default-avatar-icon.png';
      
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: photoURL, // Guardamos la foto de Google
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: '',
        bio: '',
      });

      // También asegurarnos de que esté actualizada en Auth
      if (auth.currentUser && photoURL) {
        await updateProfile(auth.currentUser, {
          photoURL: photoURL
        });
      }
    }
  } catch (error) {
    console.error('Error creating initial user profile:', error);
    throw error;
  }
};

// Helper para sincronizar la foto de Google si es necesario
export const syncGooglePhotoIfNeeded = async (user: User) => {
  if (!user?.uid || !user.photoURL) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    if (
      (!data.photoURL || data.photoURL === '/default-avatar-icon.png') &&
      user.photoURL !== '/default-avatar-icon.png'
    ) {
      await updateDoc(userRef, {
        photoURL: user.photoURL,
        updatedAt: new Date().toISOString(),
      });
    }
  }
};

// Función actualizada de sign in con Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    // Asegurarnos de que la foto se guarde al crear el perfil inicial
    await createInitialUserProfile(result.user);
    // Sincronizar la foto de Google si es necesario
    await syncGooglePhotoIfNeeded(result.user);
    // También actualizamos el perfil si el usuario ya existe
    const userRef = doc(db, 'users', result.user.uid);
    await updateDoc(userRef, {
      photoURL: result.user.photoURL,
      updatedAt: new Date().toISOString(),
    }).catch(() => {
      // Si falla el updateDoc, significa que el documento no existe
      // pero ya fue manejado por createInitialUserProfile
    });
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Función específica para guardar datos de contacto
export const saveContactData = async (data: any) => {
  try {
    if (!auth.currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    const documentData = {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Usar setDoc con el UID como ID del documento para que coincida con las reglas
    const docRef = doc(db, 'DatosContacto', auth.currentUser.uid);
    await setDoc(docRef, documentData);
    
    return {
      id: auth.currentUser.uid,
      ...documentData
    };
  } catch (error) {
    console.error('Error saving contact data:', error);
    throw error;
  }
};

// Función para obtener datos de contacto del usuario
export const getContactData = async () => {
  try {
    if (!auth.currentUser?.uid) {
      throw new Error('Usuario no autenticado');
    }

    const docRef = doc(db, 'DatosContacto', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting contact data:', error);
    throw error;
  }
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    // Añadir userId y timestamps automáticamente
    const documentData = {
      ...data,
      userId: auth.currentUser?.uid, // Importante: incluir el userId
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collectionName), documentData);
    return {
      id: docRef.id,
      ...documentData
    };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, updateData);
    return {
      id,
      ...updateData
    };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

interface ProfileData {
  displayName: string;
  location: string;
  bio: string;
}

export const updateBasicProfile = async (userId: string, profileData: ProfileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const createOrUpdateUserProfile = async (userId: string, userData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
    }).catch(async () => {
      // Si el documento no existe, lo creamos
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

interface UserProfile {
  displayName: string;
  location: string;
  bio: string;
  photoURL?: string;
}

export const updateUserProfile = async (userId: string, profileData: UserProfile) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Asegurarse de que todos los campos existan antes de actualizar
    let updateData = {
      displayName: profileData.displayName || '',
      location: profileData.location || '',
      bio: profileData.bio || '',
      updatedAt: serverTimestamp(),
    };

    // Solo incluir photoURL si existe
    if (profileData.photoURL) {
      updateData = {
        ...updateData,
        photoURL: profileData.photoURL
      } as { displayName: string; location: string; bio: string; photoURL: string; updatedAt: FieldValue };
    }

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Función para subir y actualizar la foto de perfil
export const updateProfilePhoto = async (userId: string, file: File) => {
  try {
    // 1. Subir la imagen a Firebase Storage
    const photoPath = `profile-photos/${userId}/${file.name}`;
    const storageRef = ref(storage, photoPath);
    await uploadBytes(storageRef, file);
    
    // 2. Obtener la URL de la imagen
    const photoURL = await getDownloadURL(storageRef);
    
    // 3. Actualizar el perfil en Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL });
    }
    
    // 4. Actualizar el perfil en Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL,
      updatedAt: new Date().toISOString(),
    });

    return photoURL;
  } catch (error) {
    console.error('Error updating profile photo:', error);
    throw error;
  }
};

// Función para eliminar la foto de perfil
export const deleteProfilePhoto = async (userId: string) => {
  try {
    const defaultPhotoURL = '/default-avatar-icon.png';
    
    // 1. Actualizar Auth con la foto por defecto
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: defaultPhotoURL });
    }
    
    // 2. Actualizar Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL: defaultPhotoURL,
      updatedAt: new Date().toISOString(),
    });

    return defaultPhotoURL;
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    throw error;
  }
};

// Actualizar la función updateAuthProfile para manejar correctamente los errores
export const updateAuthProfile = async (user: any, profileData: { displayName?: string; photoURL?: string }) => {
  try {
    await updateProfile(user, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL,
    });
    return true;
  } catch (error) {
    console.error('Error updating auth profile:', error);
    throw error;
  }
};
