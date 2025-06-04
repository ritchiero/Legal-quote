"use client";

import React, { createContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { signInWithGoogle, createInitialUserProfile, getUserProfile, logoutUser } from "../firebase/firebaseUtils";
import type { AuthContextType } from '../types/auth';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener datos adicionales del perfil de Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);
          
          // Combinar datos de Auth y Firestore
          setUser({
            ...firebaseUser,
            photoURL: userProfile?.photoURL || firebaseUser.photoURL,
            displayName: userProfile?.displayName || firebaseUser.displayName,
            // otros campos que necesites
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  
  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  // Función para actualizar el usuario
  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setUser({
          ...auth.currentUser,
          photoURL: userProfile?.photoURL || auth.currentUser.photoURL,
          displayName: userProfile?.displayName || auth.currentUser.displayName,
        });
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  // Añadir función de signOut
  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      refreshUser,
      signOut: handleSignOut,
      signInWithEmail: async (email: string, password: string) => {
        await handleSignInWithEmail(email, password);
      },
      signUp: async (email: string, password: string) => {
        await handleSignUp(email, password);
      },
      signInWithGoogle: handleSignInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
}
