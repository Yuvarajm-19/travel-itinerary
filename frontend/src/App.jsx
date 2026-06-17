import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Upload     from './pages/Upload';
import Itinerary  from './pages/Itinerary';
import SharedView from './pages/SharedView';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#6c63ff', light: '#9b94ff', dark: '#4a42cc' },
    secondary:  { main: '#ff6584', light: '#ff8fa3', dark: '#cc3d5a' },
    background: { default: '#0a0f1e', paper: '#111827' },
    text:       { primary: '#e8eaf6', secondary: '#9ca3af' },
    success:    { main: '#10b981' },
    warning:    { main: '#f59e0b' },
    error:      { main: '#ef4444' },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    h1: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 300 },
    h2: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 300 },
    h3: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 },
    h4: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6c63ff 0%, #9b94ff 100%)',
          boxShadow: '0 4px 20px rgba(108, 99, 255, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a52e0 0%, #8a83ff 100%)',
            boxShadow: '0 6px 28px rgba(108, 99, 255, 0.5)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(108,99,255,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#6c63ff' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/register"   element={<Register />} />
            <Route path="/share/:id"  element={<SharedView />} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload"     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/itinerary/:id" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
