import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { FlightTakeoff, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <FlightTakeoff sx={{ color: '#6c63ff', fontSize: 28 }} />
            <Typography sx={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', color: '#e8eaf6', fontStyle: 'italic' }}>WanderAI</Typography>
          </Box>
          <Typography variant="h3" sx={{ fontSize: '2rem', mb: 1, fontStyle: 'italic' }}>Create your account</Typography>
          <Typography sx={{ color: '#9ca3af' }}>Start planning smarter trips</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 4, background: '#111827', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <TextField fullWidth label="Full name" name="name" value={form.name} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Email address" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" name="password" type={showPw ? 'text' : 'password'} value={form.password}
            onChange={handleChange} required sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(p => !p)} edge="end" sx={{ color: '#6b7280' }}>
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />
          <TextField fullWidth label="Confirm password" name="confirm" type={showPw ? 'text' : 'password'} value={form.confirm}
            onChange={handleChange} required sx={{ mb: 3 }} />

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, fontSize: '1rem', mb: 3 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <Typography sx={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#9b94ff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
