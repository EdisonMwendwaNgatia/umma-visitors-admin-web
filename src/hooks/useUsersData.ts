import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, onValue, off, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth, database } from '../config/firebase';
import { User } from '../types';

export const useUsersData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    connections: 0,
    peakToday: 0,
    avgSession: 0,
  });

  // Helper function to safely parse Firestore timestamps
  const parseFirestoreTimestamp = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    
    try {
      // If it's a Firestore Timestamp object
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        return date.toISOString();
      }
      
      // If it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      
      // If it's a string that can be parsed
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // If it's a number (milliseconds)
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      return undefined;
    } catch (error) {
      console.warn('Error parsing timestamp:', timestamp, error);
      return undefined;
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('email'));
      const querySnapshot = await getDocs(q);

      const usersData: User[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const userRole = data.role || 'user';
        const defaultPlatform = userRole === 'admin' ? 'web' : 'mobile';
        
        // Safely parse timestamps
        const createdAt = parseFirestoreTimestamp(data.createdAt) || new Date().toISOString();
        const lastLoginAt = parseFirestoreTimestamp(data.lastLoginAt);

        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: userRole,
          createdAt,
          lastLoginAt,
          platform: (userRole === 'admin' ? (data.platform || defaultPlatform) : 'mobile') as 'web' | 'mobile',
          isOnline: false,
          lastSeen: null,
          deviceInfo: data.deviceInfo || '',
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const setupRealtimeListeners = useCallback(() => {
    const presenceRef = ref(database, 'status');
    
    const unsubscribePresence = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();
      const ONLINE_TTL_MS = 2 * 60 * 1000;

      if (presenceData) {
        setUsers(prevUsers => 
          prevUsers.map(user => {
            const userPresence = presenceData?.[user.uid];
            if (!userPresence) return user;

            let lastChangedMs: number | null = null;
            if (userPresence?.lastChanged) {
              const v = userPresence.lastChanged;
              if (typeof v === 'number') lastChangedMs = v;
              else if (v?.toDate) {
                try { 
                  lastChangedMs = v.toDate().getTime(); 
                } catch (e) { 
                  console.warn('Error parsing lastChanged timestamp:', v, e);
                  lastChangedMs = null; 
                }
              } else if (typeof v === 'string') {
                const parsed = Number(v);
                lastChangedMs = isFinite(parsed) ? parsed : (Date.parse(v) || null);
              }
            }

            const recentlyUpdated = lastChangedMs ? (Date.now() - lastChangedMs) <= ONLINE_TTL_MS : false;
            const platform = user.role === 'admin'
              ? (userPresence?.platform || user.platform || 'web')
              : 'mobile';

            return {
              ...user,
              isOnline: !!userPresence && userPresence.state === 'online' && recentlyUpdated,
              lastSeen: lastChangedMs ? new Date(lastChangedMs) : user.lastSeen,
              platform,
              deviceInfo: userPresence?.deviceInfo || user.deviceInfo || '',
            };
          })
        );

        const onlineCount = Object.keys(presenceData).reduce((acc, uid) => {
          const p: any = presenceData[uid];
          if (!p) return acc;
          
          let lc: number | null = null;
          const v = p.lastChanged;
          
          if (typeof v === 'number') lc = v;
          else if (v?.toDate) {
            try { 
              lc = v.toDate().getTime(); 
            } catch (e) { 
              lc = null; 
            }
          } else if (typeof v === 'string') {
            const parsed = Number(v);
            lc = isFinite(parsed) ? parsed : (Date.parse(v) || null);
          }
          
          const recent = lc ? (Date.now() - lc) <= ONLINE_TTL_MS : false;
          if (p.state === 'online' && recent) return acc + 1;
          return acc;
        }, 0);

        setRealTimeStats(prev => ({
          ...prev,
          connections: onlineCount,
          peakToday: Math.max(prev.peakToday, onlineCount),
        }));
      }
    });

    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Safely parse timestamps using helper function
        const createdAt = parseFirestoreTimestamp(data.createdAt) || new Date().toISOString();
        const lastLoginAt = parseFirestoreTimestamp(data.lastLoginAt);
        
        const userRole = data.role || 'user';
        const defaultPlatform = userRole === 'admin' ? 'web' : 'mobile';
        
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: userRole,
          createdAt,
          lastLoginAt,
          platform: (userRole === 'admin' ? (data.platform || defaultPlatform) : 'mobile') as 'web' | 'mobile',
          isOnline: false,
          lastSeen: null,
          deviceInfo: data.deviceInfo || '',
        };
      });
      
      setUsers(usersData);
    });

    return () => {
      off(presenceRef);
      unsubscribeUsers();
    };
  }, []);

  const addUser = useCallback(async (newUser: {
    email: string;
    password: string;
    displayName: string;
    role: string;
  }) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      newUser.email, 
      newUser.password
    );
    
    const user = userCredential.user;

    if (newUser.displayName.trim()) {
      await updateProfile(user, {
        displayName: newUser.displayName.trim()
      });
    }

    const userData = {
      email: newUser.email,
      displayName: newUser.displayName.trim() || '',
      role: newUser.role,
      createdAt: serverTimestamp(),
      platform: 'web',
      isActive: true,
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      uid: user.uid,
      email: newUser.email,
      displayName: newUser.displayName.trim() || '',
      role: newUser.role,
      createdAt: new Date().toISOString(),
      platform: 'web',
      isOnline: false,
    };
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
  }, []);

  const deleteUser = useCallback(async (user: User) => {
    try {
      const presenceRef = ref(database, `status/${user.uid}`);
      await remove(presenceRef);

      const userInfoRef = ref(database, `users/${user.uid}`);
      await remove(userInfoRef);

      await deleteDoc(doc(db, 'users', user.uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const cleanup = setupRealtimeListeners();
    return cleanup;
  }, [fetchUsers, setupRealtimeListeners]);

  return {
    users,
    loading,
    realTimeStats,
    fetchUsers,
    addUser,
    updateUserRole,
    deleteUser,
  };
};