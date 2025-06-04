'use client';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider, 
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { createInitialUserProfile } from '../utils/createInitialUserProfile';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export interface AuthContextType {
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === null) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const createUserDocument = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '/default-avatar-icon.png',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        datosFiscales: {
          razonSocial: '',
          rfc: '',
          regimenFiscal: '',
          telefono: '',
          direccion: {
            calle: '',
            numeroExterior: '',
            numeroInterior: '',
            colonia: '',
            codigoPostal: '',
            municipio: '',
            estado: '',
          },
          email: user.email || '',
        },
        branding: {
          nombreDespacho: '',
          slogan: '',
          anoFundacion: '',
          descripcion: '',
          sitioWeb: '',
          redes: {
            linkedin: '',
            twitter: '',
            instagram: '',
            facebook: ''
          },
          colores: {
            primario: '#000000',
            secundario: '#000000',
            terciario: '#000000'
          },
          logoURL: ''
        },
        paymentMethods: []
      }, { merge: true });

      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        throw new Error('Error: El documento no se creó correctamente');
      }

    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await createUserDocument(userCredential.user);
      
      return userCredential;
    } catch (error) {
      console.error('Error en el proceso de registro:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // También crear/actualizar el perfil para usuarios de Google
      await createInitialUserProfile(result.user);
      return result;
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        // User cancelled the popup or multiple popups were triggered
        return null;
      }
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Actualizar el perfil del usuario con la foto por defecto
      await updateProfile(userCredential.user, {
        photoURL: '/default-avatar-icon.png'
      });
      // Crear el documento del usuario
      await createUserDocument(userCredential.user);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  return {
    ...context,
    signInWithEmail: async (email: string, password: string) => {
      await signInWithEmail(email, password);
    },
    signUp: async (email: string, password: string) => {
      await signUp(email, password);
    },
    signInWithGoogle: async () => {
      await signInWithGoogle();
    },
    signUpWithEmail: async (email: string, password: string) => {
      await signUpWithEmail(email, password);
    }
  };
}

