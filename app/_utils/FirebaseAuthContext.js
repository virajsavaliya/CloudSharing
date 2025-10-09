"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, setPersistence, browserSessionPersistence } from "firebase/auth";
import { app } from "../../firebaseConfig";

const AuthContext = createContext();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const activityTimeoutRef = useRef(null);

  const updateUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new timeout
    activityTimeoutRef.current = setTimeout(() => {
      logout();
    }, SESSION_TIMEOUT);
  }, []);

  useEffect(() => {
    // Add activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => updateUserActivity();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [updateUserActivity]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    // Set session persistence to browserSession
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
          if (firebaseUser) {
            updateUserActivity();
          }
        });
        return () => unsubscribe();
      })
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
      });
  }, [updateUserActivity]);

  const logout = async () => {
    try {
      const auth = getAuth(app);
      await firebaseSignOut(auth);
      // Clear session storage
      sessionStorage.clear();
      // Clear any pending timeouts
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      logout,
      sessionTimeLeft: user ? Math.max(0, SESSION_TIMEOUT - (Date.now() - lastActivityRef.current)) : 0,
      updateUserActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}