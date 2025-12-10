import React, { useState, useEffect, useMemo } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  Select,
  FormControl,
  InputLabel,
  Grid,
  LinearProgress,
  Badge,
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
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import UserPresence from '../components/UserPresence';
import UserPresenceStatus from '../components/UserPresenceStatus';
import SendMessageDialog from '../components/SendMessageDialog';
import UserDetailsDialog from '../components/UserDetailsDialog';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, onValue, off, remove } from 'firebase/database';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { db, auth, database } from '../config/firebase';
import { User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    adminCount: 0,
    userCount: 0,
    webUsers: 0,
    mobileUsers: 0,
    offlineUsers: 0,
    activeToday: 0,
  });
  const [realTimeStats, setRealTimeStats] = useState({
    connections: 0,
    peakToday: 0,
    avgSession: 0,
  });

  useEffect(() => {
    fetchUsers();
    setupRealtimeListeners();
    
    return () => {
      // Cleanup listeners
      const presenceRef = ref(database, 'status');
      off(presenceRef);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('email'));
      const querySnapshot = await getDocs(q);

      const usersData: User[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const userRole = data.role || 'user';
        // Admins may be web or mobile; regular users should always be treated as mobile
        const defaultPlatform = userRole === 'admin' ? 'web' : 'mobile';
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName,
          role: userRole,
          createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
          lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt).toISOString() : undefined,
          platform: (userRole === 'admin' ? (data.platform || defaultPlatform) : 'mobile') as 'web' | 'mobile',
          isOnline: false,
          lastSeen: null,
          deviceInfo: data.deviceInfo,
        };
      });

      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    // Listen to real-time database for user presence
    const presenceRef = ref(database, 'status');
    
    onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val();

      const ONLINE_TTL_MS = 2 * 60 * 1000; // consider online only if lastChanged within 2 minutes

      // Only update local user entries when we have presence info for that uid.
      // This prevents accidental overwrites of other users when presence snapshot
      // doesn't include them (or is partial).
      if (presenceData) {
        setUsers(prevUsers => 
          prevUsers.map(user => {
            const userPresence = presenceData?.[user.uid];
            if (!userPresence) {
              // Keep existing user state unchanged
              return user;
            }

            // resolve lastChanged to milliseconds
            let lastChangedMs: number | null = null;
            if (userPresence?.lastChanged) {
              const v = userPresence.lastChanged;
              if (typeof v === 'number') lastChangedMs = v;
              else if (v?.toDate) {
                try { lastChangedMs = v.toDate().getTime(); } catch (e) { lastChangedMs = null; }
              } else if (typeof v === 'string') {
                const parsed = Number(v);
                lastChangedMs = isFinite(parsed) ? parsed : (Date.parse(v) || null);
              }
            }

            const recentlyUpdated = lastChangedMs ? (Date.now() - lastChangedMs) <= ONLINE_TTL_MS : false;

            // If user is admin, allow platform to be dynamic from presence or stored value.
            // Regular users are always treated as mobile.
            const platform = user.role === 'admin'
              ? (userPresence?.platform || user.platform || 'web')
              : 'mobile';

            return {
              ...user,
              isOnline: !!userPresence && userPresence.state === 'online' && recentlyUpdated,
              // Merge lastSeen: only overwrite if we have a valid lastChanged
              lastSeen: lastChangedMs ? new Date(lastChangedMs) : user.lastSeen,
              platform,
              deviceInfo: userPresence?.deviceInfo || user.deviceInfo,
            };
          })
        );

        // Calculate real-time stats using TTL-aware logic so stale entries aren't counted
        const onlineCount = Object.keys(presenceData).reduce((acc, uid) => {
          const p: any = presenceData[uid];
          if (!p) return acc;
          let lc: number | null = null;
          const v = p.lastChanged;
          if (typeof v === 'number') lc = v;
          else if (v?.toDate) {
            try { lc = v.toDate().getTime(); } catch (e) { lc = null; }
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

    // Listen for users collection changes
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Safely convert timestamps to ISO strings
        let createdAtISO = new Date().toISOString();
        if (data.createdAt) {
          try {
            const timestamp = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            createdAtISO = timestamp.toISOString();
          } catch (e) {
            console.error('Error parsing createdAt:', data.createdAt);
          }
        }
        
        let lastLoginAtISO: string | undefined = undefined;
        if (data.lastLoginAt) {
          try {
            const timestamp = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : new Date(data.lastLoginAt);
            lastLoginAtISO = timestamp.toISOString();
          } catch (e) {
            console.error('Error parsing lastLoginAt:', data.lastLoginAt);
          }
        }
        
        const userRole = data.role || 'user';
        const defaultPlatform = userRole === 'admin' ? 'web' : 'mobile';
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName,
          role: userRole,
          createdAt: createdAtISO,
          lastLoginAt: lastLoginAtISO,
          // Force non-admin users to 'mobile'; admins remain dynamic
          platform: (userRole === 'admin' ? (data.platform || defaultPlatform) : 'mobile') as 'web' | 'mobile',
          isOnline: false,
          lastSeen: null,
          deviceInfo: data.deviceInfo,
        };
      });
      
      setUsers(usersData);
      calculateStats(usersData);
    });

    return () => unsubscribe();
  };

  const calculateStats = (userList: User[]) => {
    const totalUsers = userList.length;
    const onlineUsers = userList.filter(user => user.isOnline).length;
    const adminCount = userList.filter(user => user.role === 'admin').length;
    const userCount = userList.filter(user => user.role === 'user').length;
    const webUsers = userList.filter(user => user.platform === 'web').length;
    const mobileUsers = userList.filter(user => user.platform === 'mobile').length;
    
    // Calculate active today (users who logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = userList.filter(user => 
      user.lastLoginAt && new Date(user.lastLoginAt) >= today
    ).length;

    setStats({
      totalUsers,
      onlineUsers,
      adminCount,
      userCount,
      webUsers,
      mobileUsers,
      offlineUsers: totalUsers - onlineUsers,
      activeToday,
    });
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
        displayName: editingUser.displayName.trim(),
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setUsers(prevUsers => prevUsers.map(u => u.uid === editingUser.uid ? { ...u, displayName: editingUser.displayName } : u));

      setEditingUser(null);
      showSnackbar('User name updated successfully', 'success');
    } catch (error) {
      console.error('Error saving display name:', error);
      showSnackbar('Error updating user name', 'error');
    }
  };

  const handleUpdateRole = async (user: User, newRole: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });

      // Update local state
      setUsers(prev => prev.map(u => {
        if (u.uid !== user.uid) return u;
        const updated: User = { ...u, role: newRole };
        // If demoting to regular user, force platform to mobile
        if (newRole !== 'admin') updated.platform = 'mobile';
        return updated;
      }));

      setRoleDialog({ open: false, user: null });
      showSnackbar('User role updated', 'success');
    } catch (err) {
      console.error('Error updating role:', err);
      showSnackbar('Error updating user role', 'error');
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
        createdAt: serverTimestamp(),
        platform: 'web',
        isActive: true,
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Add to local state
      const createdUser: User = {
        uid: user.uid,
        email: newUser.email,
        displayName: newUser.displayName.trim() || '',
        role: newUser.role,
        createdAt: new Date().toISOString(),
        platform: 'web',
        isOnline: false,
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
      // Remove presence data from Realtime Database
      try {
        const presenceRef = ref(database, `status/${userToDelete.uid}`);
        await remove(presenceRef);
      } catch (error) {
        console.warn('Could not remove presence data:', error);
      }

      // Remove user info from Realtime Database
      try {
        const userInfoRef = ref(database, `users/${userToDelete.uid}`);
        await remove(userInfoRef);
      } catch (error) {
        console.warn('Could not remove user info:', error);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userToDelete.uid));

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

  const openRoleDialog = (user: User) => {
    setRoleDialog({
      open: true,
      user,
    });
  };

  const openMessageDialog = (user: User) => {
    setMessageDialog({
      open: true,
      user,
    });
  };

  const openDetailsDialog = (user: User) => {
    setDetailsDialog({
      open: true,
      user,
    });
  };

  // Filter users based on selected filters and search
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Filter by status
      if (filterStatus === 'online' && !user.isOnline) return false;
      if (filterStatus === 'offline' && user.isOnline) return false;
      
      // Filter by role
      if (filterRole !== 'all' && user.role !== filterRole) return false;
      
      // Filter by platform
      if (filterPlatform !== 'all' && user.platform !== filterPlatform) return false;
      
      return true;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.displayName && user.displayName.toLowerCase().includes(query)) ||
        (user.deviceInfo && user.deviceInfo.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [users, filterStatus, filterRole, filterPlatform, searchQuery]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('User Management Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableData = filteredUsers.map(user => [
      user.displayName || user.email.split('@')[0],
      user.email,
      user.role || 'user',
      user.platform || 'web',
      user.isOnline ? 'Online' : 'Offline',
      user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never',
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Name', 'Email', 'Role', 'Platform', 'Status', 'Last Active']],
      body: tableData,
      startY: 40,
    });
    
    // Add summary
    const summaryY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary', 14, summaryY);
    doc.setFontSize(10);
    doc.text(`Total Users: ${stats.totalUsers}`, 14, summaryY + 8);
    doc.text(`Online Users: ${stats.onlineUsers}`, 14, summaryY + 16);
    doc.text(`Offline Users: ${stats.offlineUsers}`, 14, summaryY + 24);
    
    doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(user => ({
      Name: user.displayName || user.email.split('@')[0],
      Email: user.email,
      Role: user.role || 'user',
      Platform: user.platform || 'web',
      Status: user.isOnline ? 'Online' : 'Offline',
      'Last Active': user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never',
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      'Device Info': user.deviceInfo || 'N/A',
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    XLSX.writeFile(workbook, `users-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
    progress?: number;
  }> = ({ title, value, subtitle, icon, color, trend, progress }) => (
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
              {trend !== undefined && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trend >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: 600,
                    mt: 1
                  }}
                >
                  {trend >= 0 ? '+' : ''}{trend} today
                </Typography>
              )}
              {progress !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: `${color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: color,
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {progress}% active
                  </Typography>
                </Box>
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
          <UserPresence user={params.row} size="medium" />
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
                  {params.row.isOnline && (
                    <Badge
                      color="success"
                      variant="dot"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {params.row.email}
                </Typography>
                {params.row.platform && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Tooltip title={params.row.platform === 'mobile' ? 'Mobile App' : 'Web'}>
                      {params.row.platform === 'mobile' ? (
                        <PhoneIphoneIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                      ) : (
                        <ComputerIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                      )}
                    </Tooltip>
                    {params.row.deviceInfo && (
                      <Typography variant="caption" color="text.secondary">
                        {params.row.deviceInfo}
                      </Typography>
                    )}
                  </Box>
                )}
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
              <Tooltip title="Change Role">
                <IconButton
                  size="small"
                  onClick={() => openRoleDialog(params.row)}
                  sx={{ 
                    color: '#6B7280',
                    '&:hover': {
                      color: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }
                  }}
                >
                  <BadgeIcon fontSize="small" />
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
      field: 'platform',
      headerName: 'Platform',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'mobile' ? <PhoneIphoneIcon /> : <ComputerIcon />}
          label={params.value === 'mobile' ? 'Mobile' : 'Web'}
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 500,
            borderColor: params.value === 'mobile' ? '#8B5CF6' : '#3B82F6',
            color: params.value === 'mobile' ? '#8B5CF6' : '#3B82F6',
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams<User>) => {
        return <UserPresenceStatus user={params.row} />;
      },
    },
    {
      field: 'lastSeen',
      headerName: 'Last Active',
      width: 180,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row.lastSeen) return 'Never';
        
        const date = new Date(params.row.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row.createdAt) return 'N/A';
        try {
          const date = new Date(params.row.createdAt);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (error) {
          return 'Invalid date';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
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
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Send Message">
              <IconButton 
                size="small"
                onClick={() => openMessageDialog(params.row)}
                sx={{ 
                  color: '#6B7280',
                  '&:hover': {
                    color: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton 
                size="small"
                onClick={() => openDetailsDialog(params.row)}
                sx={{ 
                  color: '#6B7280',
                  '&:hover': {
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      ),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} sx={{ color: '#10B981' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading users...
        </Typography>
      </Box>
    );
  }

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
          Manage system users, track activity across web and mobile platforms
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle="Registered users"
            icon={<PersonIcon />}
            color="#007AFF"
          />
        </Box>
        <Box>
          <StatCard
            title="Online Now"
            value={stats.onlineUsers}
            subtitle="Active connections"
            icon={<CheckCircleIcon />}
            color="#10B981"
            progress={stats.totalUsers > 0 ? (stats.onlineUsers / stats.totalUsers) * 100 : 0}
          />
        </Box>
        <Box>
          <StatCard
            title="Active Today"
            value={stats.activeToday}
            subtitle="Users logged in today"
            icon={<CalendarTodayIcon />}
            color="#8B5CF6"
          />
        </Box>
        <Box>
          <StatCard
            title="Real-time"
            value={realTimeStats.connections}
            subtitle={`Peak: ${realTimeStats.peakToday}`}
            icon={<DeviceHubIcon />}
            color="#3B82F6"
          />
        </Box>
      </Box>

      {/* Platform Distribution */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Platform Distribution
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ComputerIcon sx={{ color: '#3B82F6', mr: 1 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Web Users
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.webUsers} ({stats.totalUsers > 0 ? Math.round((stats.webUsers / stats.totalUsers) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalUsers > 0 ? (stats.webUsers / stats.totalUsers) * 100 : 0}
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#3B82F620',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#3B82F6',
                  }
                }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PhoneIphoneIcon sx={{ color: '#8B5CF6', mr: 1 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Mobile Users
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {stats.mobileUsers} ({stats.totalUsers > 0 ? Math.round((stats.mobileUsers / stats.totalUsers) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalUsers > 0 ? (stats.mobileUsers / stats.totalUsers) * 100 : 0}
                sx={{ 
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#8B5CF620',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8B5CF6',
                  }
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

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
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} showing
                {filteredUsers.length !== users.length && ` of ${users.length}`}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportPDF}
                sx={{ mr: 1 }}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportExcel}
                sx={{ mr: 1 }}
              >
                Excel
              </Button>
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

          {/* Search and Filters */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 250 }}
            />
            
            <Box display="flex" alignItems="center" gap={1}>
              <FilterListIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Filter by:
              </Typography>
            </Box>
            
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={(e, value) => setFilterStatus(value || 'all')}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="online">Online</ToggleButton>
              <ToggleButton value="offline">Offline</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                label="Role"
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={filterPlatform}
                label="Platform"
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="web">Web</MenuItem>
                <MenuItem value="mobile">Mobile</MenuItem>
              </Select>
            </FormControl>

            {(filterStatus !== 'all' || filterRole !== 'all' || filterPlatform !== 'all' || searchQuery) && (
              <Button
                size="small"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterRole('all');
                  setFilterPlatform('all');
                  setSearchQuery('');
                }}
              >
                Clear All
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Paper sx={{ width: '100%', border: 'none' }} elevation={0}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              loading={loading && users.length === 0}
              autoHeight
              pageSizeOptions={[10, 25, 50, 100]}
              getRowId={(row) => row.uid}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
                sorting: {
                  sortModel: [{ field: 'isOnline', sort: 'desc' }, { field: 'lastSeen', sort: 'desc' }],
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
                '& .MuiDataGrid-row--online': {
                  backgroundColor: 'rgba(16, 185, 129, 0.02)',
                },
              }}
              getRowClassName={(params) => 
                params.row.isOnline ? 'MuiDataGrid-row--online' : ''
              }
              slots={{
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
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
              type={showPassword ? 'text' : 'password'}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
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

      {/* Role Change Dialog */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#F0F9FF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 700
        }}>
          Change User Role
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {roleDialog.user && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Change role for <strong>{roleDialog.user.displayName || roleDialog.user.email}</strong>
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>New Role</InputLabel>
                <Select
                  value={roleDialog.user.role || 'user'}
                  label="New Role"
                  onChange={(e) => {
                    setRoleDialog({
                      ...roleDialog,
                      user: { ...roleDialog.user!, role: e.target.value as 'user' | 'admin' }
                    });
                  }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  Administrators have full access to all system features.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setRoleDialog({ open: false, user: null })} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => roleDialog.user && handleUpdateRole(roleDialog.user, roleDialog.user.role || 'user')}
            variant="contained"
            disabled={!roleDialog.user}
            sx={{
              backgroundColor: '#3B82F6',
              '&:hover': {
                backgroundColor: '#2563EB',
              }
            }}
            startIcon={<CheckCircleIcon />}
          >
            Update Role
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
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Platform: {deleteDialog.user.platform === 'mobile' ? 'Mobile App' : 'Web'}
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

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={messageDialog.open}
        onClose={() => setMessageDialog({ open: false, user: null })}
        user={messageDialog.user}
        currentUserEmail={auth.currentUser?.email || undefined}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, user: null })}
        user={detailsDialog.user}
      />

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