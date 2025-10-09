"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, setPersistence, browserSessionPersistence } from "firebase/auth";
import { app } from "../../firebaseConfig";

const AuthContext = createContext();

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const activityTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Function to handle user activity
  const updateUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Function to check session timeout
  const checkSessionTimeout = useCallback(() => {
    if (user && Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
      logout();
    }
  }, [user]);

  // Setup session timeout checker
  useEffect(() => {
    if (user) {
      const interval = setInterval(checkSessionTimeout, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user, checkSessionTimeout]);

  // Setup activity listeners
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
      events.forEach(event => {
        window.addEventListener(event, updateUserActivity);
      });

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, updateUserActivity);
        });
      };
    }
  }, [user, updateUserActivity]);

  // Handle tab/window close
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && user) {
        // Store last active timestamp when page is hidden
        sessionStorage.setItem('lastActive', Date.now().toString());
      } else if (document.visibilityState === 'visible' && user) {
        // Check if session expired while page was hidden
        const lastActive = parseInt(sessionStorage.getItem('lastActive') || '0');
        if (Date.now() - lastActive > SESSION_TIMEOUT) {
          logout();
        }
      }
    };

    const handleBeforeUnload = () => {
      if (user) {
        // Clear session data on page close
        sessionStorage.clear();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

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
      sessionTimeLeft: user ? Math.max(0, SESSION_TIMEOUT - (Date.now() - lastActivityRef.current)) : 0
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
