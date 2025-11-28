// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Visitors from './pages/Visitors';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Login from './pages/Login';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#10B981',
    },
    secondary: {
      main: '#EF4444',
    },
    background: {
      default: '#F8FAFC',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
      }}>
        <div style={{ 
          color: 'white', 
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 600
        }}>
          Loading...
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppDataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/visitors" element={
                <ProtectedRoute>
                  <Layout>
                    <Visitors />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute>
                  <Layout>
                    <Alerts />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;