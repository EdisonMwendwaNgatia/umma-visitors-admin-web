// hooks/useOverdueVisitors.ts
import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Visitor } from '../types';

export const useOverdueVisitors = () => {
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'visitors'), (snapshot) => {
      const visitors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitor[];

      const now = new Date();
      
      // Calculate overdue visitors (12+ hours)
      const overdueVisitors = visitors.filter(visitor => {
        if (visitor.isCheckedOut) return false;
        
        const timeIn = visitor.timeIn instanceof Timestamp ? 
          visitor.timeIn.toDate() : new Date(visitor.timeIn);
        
        const hoursSinceCheckIn = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
        return hoursSinceCheckIn > 12;
      });

      setOverdueCount(overdueVisitors.length);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { overdueCount, loading };
};