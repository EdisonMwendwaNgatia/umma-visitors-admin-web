import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import { User } from '../types';

interface SendMessageDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  currentUserEmail?: string;
}

const SendMessageDialog: React.FC<SendMessageDialogProps> = ({
  open,
  onClose,
  user,
  currentUserEmail,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = () => {
    if (!user?.email) {
      setError('No email address found for this user');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError(null);

    // Create mailto link
    const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}${currentUserEmail ? `%0D%0A%0D%0ASent by: ${currentUserEmail}` : ''}`;

    // Open email client
    window.open(mailtoLink, '_blank');

    // Simulate sending delay
    setTimeout(() => {
      setLoading(false);
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#F0F9FF',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <EmailIcon color="primary" />
          <Typography variant="h6">
            Send Message to {user?.displayName || 'User'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {user && (
          <>
            {/* User Info */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#D1FAE5',
                    color: '#059669',
                  }}
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {user.displayName || user.email.split('@')[0]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Chip
                  label={user.role || 'user'}
                  size="small"
                  color={user.role === 'admin' ? 'primary' : 'default'}
                />
              </Box>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<PersonIcon />}
                  label={user.platform === 'mobile' ? 'Mobile User' : 'Web User'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={user.isOnline ? 'Online' : 'Offline'}
                  size="small"
                  color={user.isOnline ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Email Form */}
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                required
                placeholder="Enter email subject"
                disabled={loading}
              />
              
              <TextField
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                required
                multiline
                rows={6}
                placeholder={`Type your message to ${user.displayName || user.email}...`}
                disabled={loading}
                InputProps={{
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }
                }}
              />

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  This will open your default email client. Make sure you have an email client configured.
                </Typography>
                {currentUserEmail && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>From:</strong> {currentUserEmail}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>To:</strong> {user.email}
                </Typography>
              </Alert>

              {currentUserEmail && user.email === currentUserEmail && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    You are sending a message to yourself.
                  </Typography>
                </Alert>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendEmail}
          variant="contained"
          disabled={loading || !user?.email || !subject.trim() || !message.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{
            backgroundColor: '#3B82F6',
            '&:hover': {
              backgroundColor: '#2563EB',
            }
          }}
        >
          {loading ? 'Opening Email...' : 'Open Email Client'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendMessageDialog;