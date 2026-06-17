import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { FlightTakeoff, Dashboard, CloudUpload, Menu as MenuIcon, Logout, Person } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { label: 'New Trip', path: '/upload', icon: <CloudUpload /> },
];

export default function AppLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl]     = useState(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const NavLinks = () => (
    <List sx={{ p: 0 }}>
      {navItems.map((item) => (
        <ListItemButton key={item.path} selected={location.pathname === item.path}
          onClick={() => { navigate(item.path); setDrawerOpen(false); }}
          sx={{ borderRadius: 2, mx: 1, mb: 0.5, '&.Mui-selected': { background: 'rgba(108,99,255,0.15)', color: '#9b94ff' } }}>
          <ListItemIcon sx={{ color: location.pathname === item.path ? '#9b94ff' : '#6b7280', minWidth: 36 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0f1e' }}>
      {/* TOP NAV */}
      <Box component="nav" sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2, md: 4 }, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(20px)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ display: { md: 'none' }, color: '#9ca3af' }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <FlightTakeoff sx={{ color: '#6c63ff', fontSize: 24 }} />
            <Typography sx={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', color: '#e8eaf6', fontStyle: 'italic' }}>WanderAI</Typography>
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          {navItems.map((item) => (
            <Button key={item.path} startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                color: location.pathname === item.path ? '#9b94ff' : '#9ca3af',
                background: location.pathname === item.path ? 'rgba(108,99,255,0.12)' : 'transparent',
                '&:hover': { color: '#e8eaf6', background: 'rgba(255,255,255,0.05)' },
              }}>
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6c63ff, #9b94ff)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { background: '#1a2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, mt: 1 } }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#e8eaf6', fontSize: '0.9rem' }}>{user?.name}</Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>{user?.email}</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <MenuItem onClick={handleLogout} sx={{ color: '#ef4444', gap: 1.5, py: 1.5 }}>
              <Logout fontSize="small" /> Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* MOBILE DRAWER */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, background: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)' } }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlightTakeoff sx={{ color: '#6c63ff' }} />
          <Typography sx={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#e8eaf6' }}>WanderAI</Typography>
        </Box>
        <Box sx={{ p: 1, flex: 1 }}><NavLinks /></Box>
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button fullWidth startIcon={<Logout />} onClick={handleLogout} sx={{ color: '#ef4444', justifyContent: 'flex-start' }}>Sign out</Button>
        </Box>
      </Drawer>

      {/* PAGE CONTENT */}
      <Box component="main">{children}</Box>
    </Box>
  );
}
