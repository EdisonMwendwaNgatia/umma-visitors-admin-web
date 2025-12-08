// components/EditHistoryDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { Timestamp } from 'firebase/firestore';

interface EditHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  editHistory: any[];
  users: any[];
  visitorName?: string;
}

export const EditHistoryDialog: React.FC<EditHistoryDialogProps> = ({
  open,
  onClose,
  editHistory,
  users,
  visitorName,
}) => {
  const getDisplayName = (uid: string) => {
    if (!uid) return 'System';
    const user = users.find(u => u.uid === uid);
    return user?.displayName || user?.email?.split('@')[0] || uid;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleString();
    }
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    return 'N/A';
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit History
        {visitorName && (
          <Typography variant="body2" color="text.secondary">
            Visitor: {visitorName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {editHistory?.length > 0 ? (
          <List>
            {editHistory
              .slice()
              .reverse()
              .map((edit, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                          <Chip
                            label={edit.field}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Box>
                            <Typography variant="body2">
                              By: <strong>{getDisplayName(edit.editedBy)}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(edit.editedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          <Box display="flex" gap={2}>
                            <Box flex={1}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Old Value:
                              </Typography>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {formatValue(edit.oldValue)}
                              </Typography>
                            </Box>
                            <Box flex={1}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                New Value:
                              </Typography>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {formatValue(edit.newValue)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < editHistory.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No edit history available for this visitor
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};