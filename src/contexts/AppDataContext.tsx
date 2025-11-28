// contexts/AppDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Visitor } from '../types';

interface AppDataContextType {
  overdueCount: number;
  totalVisitors: number;
  activeVisitors: number;
  loading: boolean;
}

const AppDataContext = createContext<AppDataContextType>({
  overdueCount: 0,
  totalVisitors: 0,
  activeVisitors: 0,
  loading: true,
});

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'visitors'), (snapshot) => {
      const visitors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitor[];

      const now = new Date();
      
      // Calculate all stats
      const activeVisitors = visitors.filter(visitor => !visitor.isCheckedOut);
      const overdueVisitors = activeVisitors.filter(visitor => {
        const timeIn = visitor.timeIn instanceof Timestamp ? 
          visitor.timeIn.toDate() : new Date(visitor.timeIn);
        
        const hoursSinceCheckIn = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
        return hoursSinceCheckIn > 12;
      });

      setOverdueCount(overdueVisitors.length);
      setTotalVisitors(visitors.length);
      setActiveVisitors(activeVisitors.length);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AppDataContext.Provider value={{
      overdueCount,
      totalVisitors,
      activeVisitors,
      loading,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};