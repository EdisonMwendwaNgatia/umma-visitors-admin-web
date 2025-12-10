// hooks/useUserPresence.ts
import { useEffect } from 'react';
import { ref, onDisconnect, update, serverTimestamp, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { auth } from '../config/firebase';

// Robust presence hook: listens to auth changes and then to Realtime DB
// connection state so presence is set when the user is actually online.
export const useUserPresence = () => {
  useEffect(() => {
    let connectedUnsub: (() => void) | null = null;
    let lastUserRef: ReturnType<typeof ref> | null = null;
    // Listen to auth state so we react when a user signs in/out
    const authUnsub = auth.onAuthStateChanged((user) => {
      // Clean up any previous connected listener
      if (connectedUnsub) {
        try { connectedUnsub(); } catch (e) { /* ignore */ }
        connectedUnsub = null;
      }
      // If there was a previously tracked user (signed out), mark them offline explicitly
      if (!user && lastUserRef) {
        try {
          update(lastUserRef, {
            state: 'offline',
            lastChanged: serverTimestamp(),
          });
        } catch (e) {
          /* ignore */
        }
        lastUserRef = null;
        return;
      }

      if (!user) return;

      const userStatusRef = ref(database, `status/${user.uid}`);
      lastUserRef = userStatusRef;
      const connectedRef = ref(database, '.info/connected');

      // Subscribe to connection state
      connectedUnsub = onValue(connectedRef, (snap) => {
        const isConnected = snap.val() === true;
        if (isConnected) {
          // Mark online by updating only the current user's node (do not touch other users)
          update(userStatusRef, {
            state: 'online',
            lastChanged: serverTimestamp(),
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          }).catch((e) => console.warn('Failed to update presence online', e));

          // Ensure onDisconnect marks this uid offline (onDisconnect affects only this ref)
          try {
            onDisconnect(userStatusRef).set({
              state: 'offline',
              lastChanged: serverTimestamp(),
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            });
          } catch (e) {
            console.warn('onDisconnect could not be registered', e);
          }
        }
      });
    });

    return () => {
      // Cleanup auth and connection listeners
      try { authUnsub(); } catch (e) { /* ignore */ }
      if (connectedUnsub) {
        try { connectedUnsub(); } catch (e) { /* ignore */ }
      }
      // When the hook unmounts, try to mark the last known user offline
      if (lastUserRef) {
        try {
          update(lastUserRef, { state: 'offline', lastChanged: serverTimestamp() });
        } catch (e) { /* ignore */ }
      }
    };
  }, []);
};