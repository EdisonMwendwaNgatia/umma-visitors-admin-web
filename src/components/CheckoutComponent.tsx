// components/CheckoutComponent.tsx
import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Visitor } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CheckoutComponentProps {
  visitor: Visitor;
  currentUserUid: string;
  currentUserEmail: string;
  onCheckoutSuccess: (updatedVisitor: Visitor) => void;
  isAdmin: boolean;
  isVisitorOverdue: (visitor: Visitor) => boolean;
  formatDateTime: (date: Date | undefined) => string;
}

const CheckoutComponent: React.FC<CheckoutComponentProps> = ({
  visitor,
  currentUserUid,
  currentUserEmail,
  onCheckoutSuccess,
  isAdmin,
  isVisitorOverdue,
  formatDateTime,
}) => {
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (visitor.isCheckedOut) {
      alert('Visitor is already checked out.');
      return;
    }

    if (!isAdmin) {
      alert('Only admins can check out visitors.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const visitorRef = doc(db, 'visitors', visitor.id);
      
      // Create edit history entry
      const editHistoryEntry = {
        field: 'checkout',
        oldValue: false,
        newValue: true,
        editedBy: currentUserUid,
        editedAt: new Date(), // Use regular Date for arrayUnion
      };

      // Update the document with serverTimestamp for main fields
      await updateDoc(visitorRef, {
        isCheckedOut: true,
        timeOut: serverTimestamp(), // Use serverTimestamp for checkout time
        checkedOutBy: currentUserUid,
        editedBy: currentUserUid,
        lastEditedAt: serverTimestamp(),
        editHistory: [...(visitor.editHistory || []), editHistoryEntry]
      });

      // Create updated visitor object for local state
      const updatedVisitor: Visitor = {
        ...visitor,
        isCheckedOut: true,
        timeOut: new Date(), // Local date for immediate display
        checkedOutBy: currentUserUid,
        editedBy: currentUserUid,
        lastEditedAt: new Date(),
        editHistory: [...(visitor.editHistory || []), editHistoryEntry]
      };

      onCheckoutSuccess(updatedVisitor);
      setCheckoutDialogOpen(false);
      alert(`${visitor.visitorName} has been checked out successfully.`);
    } catch (error) {
      console.error('Error checking out visitor:', error);
      alert('Failed to check out visitor. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Show checkout button only for non-checked-out visitors and admins
  if (visitor.isCheckedOut || !isAdmin) {
    return (
      <Chip
        label={visitor.isCheckedOut ? "Checked Out" : "Active"}
        color={visitor.isCheckedOut ? "default" : "success"}
        variant={visitor.isCheckedOut ? "outlined" : "filled"}
        size="small"
      />
    );
  }

  const isOverdue = isVisitorOverdue(visitor);

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        {isOverdue ? (
          <Chip
            icon={<WarningIcon />}
            label="Overdue"
            color="error"
            variant="filled"
            size="small"
          />
        ) : (
          <Chip
            label="Active"
            color="success"
            variant="filled"
            size="small"
          />
        )}
        <Tooltip title="Check Out">
          <IconButton
            size="small"
            color="primary"
            onClick={() => setCheckoutDialogOpen(true)}
            disabled={checkoutLoading}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Checkout Confirmation Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        onClose={() => !checkoutLoading && setCheckoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Check Out Visitor</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to check out <strong>{visitor.visitorName}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Phone: {visitor.phoneNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ID Number: {visitor.idNumber || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Checked in at: {formatDateTime(visitor.timeIn)}
            </Typography>
            {visitor.tagNumber && visitor.tagNumber !== 'N/A' && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tag Number: #{visitor.tagNumber}
              </Typography>
            )}
            {visitor.refNumber && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vehicle Plate: {visitor.refNumber}
              </Typography>
            )}
            {isOverdue && (
              <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                This visitor is overdue (checked in for more than 12 hours).
              </Alert>
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              This action will be recorded in the edit history. Check out will be performed by: <strong>{currentUserEmail}</strong>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCheckoutDialogOpen(false)} 
            disabled={checkoutLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCheckout}
            variant="contained" 
            color="primary"
            startIcon={<LogoutIcon />}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? 'Processing...' : 'Check Out'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckoutComponent;