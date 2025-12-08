// utils/firebaseUtils.ts
import { 
  doc, 
  updateDoc, 
  arrayUnion,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const updateVisitorField = async (
  visitorId: string,
  field: string,
  newValue: any,
  oldValue: any,
  editedBy: string,
  visitorData: any
): Promise<boolean> => {
  try {
    console.log('Updating visitor field:', { visitorId, field, newValue, oldValue, editedBy });
    
    const visitorRef = doc(db, 'visitors', visitorId);
    
    // Create edit history entry - use regular Date for arrayUnion
    const editHistoryEntry = {
      field,
      oldValue: oldValue !== undefined ? oldValue : null,
      newValue: newValue !== undefined ? newValue : null,
      editedBy,
      editedAt: new Date(), // Use regular Date here, not serverTimestamp()
    };

    // Prepare the update data
    const updateData: any = {
      [field]: newValue,
      editedBy: editedBy,
      lastEditedAt: serverTimestamp(), // Use serverTimestamp() here for the main document
      editHistory: arrayUnion(editHistoryEntry),
    };

    // Update the document
    await updateDoc(visitorRef, updateData);

    console.log('Visitor field updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating visitor:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw error;
  }
};