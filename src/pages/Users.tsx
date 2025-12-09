import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Fade,
  CircularProgress,
  Avatar,
  MenuItem,
  InputAdornment,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AdminIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { User } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('email'));
      const querySnapshot = await getDocs(q);

      const usersData: User[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName,
          role: data.role || 'user',
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleEditDisplayName = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveDisplayName = async () => {
    if (!editingUser || !editingUser.displayName?.trim()) return;

    try {
      // Update in Firestore
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        displayName: editingUser.displayName.trim()
      });

      // Update local state
      setUsers(users.map(user => 
        user.uid === editingUser.uid 
          ? { ...user, displayName: editingUser.displayName } 
          : user
      ));

      setEditingUser(null);
      showSnackbar('User name updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar('Error updating user name', 'error');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      showSnackbar('Email and password are required', 'error');
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );
      
      const user = userCredential.user;

      // Update profile with display name if provided
      if (newUser.displayName.trim()) {
        await updateProfile(user, {
          displayName: newUser.displayName.trim()
        });
      }

      // Create user document in Firestore
      const userData = {
        email: newUser.email,
        displayName: newUser.displayName.trim() || '',
        role: newUser.role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Add to local state
      const createdUser: User = {
        uid: user.uid,
        email: newUser.email,
        displayName: newUser.displayName.trim() || '',
        role: newUser.role,
      };

      setUsers([...users, createdUser]);
      
      // Reset form and close dialog
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: 'user'
      });
      setAddUserOpen(false);
      
      showSnackbar('User created successfully', 'success');
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'Error creating user';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    const userToDelete = deleteDialog.user;
    
    try {
      // First delete from Firestore
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      
      // Try to delete from Authentication (only if it's not the current user)
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid !== userToDelete.uid) {
        try {
          // Note: To delete a user from Authentication, you need admin privileges
          // This would typically be done via Cloud Functions or Admin SDK
          // For now, we'll just delete from Firestore
          console.log('User deleted from Firestore. Note: Authentication deletion requires admin privileges.');
        } catch (authError) {
          console.warn('Could not delete from Authentication:', authError);
          // Continue even if auth deletion fails
        }
      } else if (currentUser?.uid === userToDelete.uid) {
        showSnackbar('Cannot delete currently logged in user', 'warning');
        setDeleteDialog({ open: false, user: null });
        return;
      }

      // Update local state
      setUsers(users.filter(user => user.uid !== userToDelete.uid));
      
      // Close dialog and show success message
      setDeleteDialog({ open: false, user: null });
      showSnackbar(`${userToDelete.displayName || userToDelete.email} has been deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Error deleting user', 'error');
    }
  };

  const openDeleteDialog = (user: User) => {
    setDeleteDialog({
      open: true,
      user,
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <Fade in={!loading} timeout={500}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          border: `1px solid ${color}20`,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box flex={1}>
              <Typography 
                color="text.secondary" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  color: color,
                  mb: 1
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box 
              sx={{ 
                color: color,
                fontSize: 48,
                ml: 2,
                opacity: 0.8
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 300,
      flex: 1,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: params.row.role === 'admin' ? '#10B981' : '#6B7280',
              fontWeight: 600,
            }}
          >
            {params.row.displayName?.charAt(0)?.toUpperCase() || params.row.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            {editingUser?.uid === params.row.uid ? (
              <TextField
                size="small"
                value={editingUser.displayName || ''}
                onChange={(e) => setEditingUser({
                  ...editingUser,
                  displayName: e.target.value
                })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveDisplayName();
                  }
                }}
                autoFocus
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#6B7280' }} />
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {params.row.displayName || params.row.email.split('@')[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {params.row.email}
                </Typography>
              </Box>
            )}
          </Box>
          {editingUser?.uid !== params.row.uid && (
            <Box display="flex" gap={0.5}>
              <Tooltip title="Edit Name">
                <IconButton
                  size="small"
                  onClick={() => handleEditDisplayName(params.row)}
                  sx={{ 
                    color: '#6B7280',
                    '&:hover': {
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {auth.currentUser?.uid !== params.row.uid && (
                <Tooltip title="Delete User">
                  <IconButton
                    size="small"
                    onClick={() => openDeleteDialog(params.row)}
                    sx={{ 
                      color: '#6B7280',
                      '&:hover': {
                        color: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'admin' ? <AdminIcon /> : <PersonIcon />}
          label={params.value || 'user'}
          color={params.value === 'admin' ? 'primary' : 'default'}
          variant="filled"
          sx={{
            fontWeight: 600,
            backgroundColor: params.value === 'admin' ? '#10B981' : '#6B7280',
            color: 'white',
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: () => (
        <Chip
          icon={<CheckCircleIcon />}
          label="Active"
          color="success"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: GridRenderCellParams<User>) => (
        editingUser?.uid === params.row.uid ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={handleSaveDisplayName}
              startIcon={<CheckCircleIcon />}
              sx={{
                backgroundColor: '#10B981',
                '&:hover': {
                  backgroundColor: '#059669',
                }
              }}
            >
              Save
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
          </Box>
        ) : null
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#10B981' }} />
      </Box>
    );
  }

  const adminCount = users.filter(user => user.role === 'admin').length;
  const userCount = users.filter(user => user.role === 'user').length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #1F2937 0%, #4B5563 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          User Management
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Manage system users and their permissions
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }} gap={3} sx={{ mb: 4 }}>
        <Box>
          <StatCard
            title="Total Users"
            value={users.length}
            subtitle="System users"
            icon={<PersonIcon />}
            color="#007AFF"
          />
        </Box>
        <Box>
          <StatCard
            title="Administrators"
            value={adminCount}
            subtitle="Admin users"
            icon={<AdminIcon />}
            color="#10B981"
          />
        </Box>
        <Box>
          <StatCard
            title="Standard Users"
            value={userCount}
            subtitle="Regular users"
            icon={<SecurityIcon />}
            color="#FF9500"
          />
        </Box>
      </Box>

      {/* Users Table */}
      <Card 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                System Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {users.length} user{users.length !== 1 ? 's' : ''} in the system
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddUserOpen(true)}
                sx={{
                  backgroundColor: '#10B981',
                  '&:hover': {
                    backgroundColor: '#059669',
                  }
                }}
              >
                Add User
              </Button>
              <Tooltip title="Refresh Users">
                <IconButton 
                  onClick={fetchUsers} 
                  disabled={loading}
                  sx={{
                    color: '#6B7280',
                    backgroundColor: '#F3F4F6',
                    '&:hover': {
                      backgroundColor: '#E5E7EB',
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Paper sx={{ width: '100%', border: 'none' }} elevation={0}>
            <DataGrid
              rows={users}
              columns={columns}
              loading={loading}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              getRowId={(row) => row.uid}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F8FAFC',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.04)',
                },
              }}
            />
          </Paper>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog 
        open={addUserOpen} 
        onClose={() => setAddUserOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 700
        }}>
          Add New User
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Email Address"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#6B7280' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              fullWidth
              required
              helperText="Password should be at least 6 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon sx={{ color: '#6B7280' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Display Name (Optional)"
              value={newUser.displayName}
              onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#6B7280' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Role"
              select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: '#6B7280' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setAddUserOpen(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained"
            disabled={!newUser.email || !newUser.password}
            sx={{
              backgroundColor: '#10B981',
              '&:hover': {
                backgroundColor: '#059669',
              }
            }}
            startIcon={<CheckCircleIcon />}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#FEF2F2',
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 700,
          color: '#DC2626'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <WarningIcon color="error" />
            Delete User
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {deleteDialog.user && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete <strong>{deleteDialog.user.displayName || deleteDialog.user.email}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email: {deleteDialog.user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Role: {deleteDialog.user.role}
              </Typography>
              <Alert 
                severity="warning" 
                sx={{ mt: 2, borderRadius: 2 }}
                icon={<WarningIcon />}
              >
                <Typography variant="body2" fontWeight={600}>
                  This action cannot be undone. The user will lose all access to the system.
                </Typography>
              </Alert>
              {auth.currentUser?.uid === deleteDialog.user.uid && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Warning: You cannot delete your own account while logged in.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, user: null })} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained"
            color="error"
            disabled={auth.currentUser?.uid === deleteDialog.user?.uid}
            startIcon={<DeleteIcon />}
            sx={{
              backgroundColor: '#DC2626',
              '&:hover': {
                backgroundColor: '#B91C1C',
              }
            }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;