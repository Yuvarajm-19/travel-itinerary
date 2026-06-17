import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid, Chip } from '@mui/material';
import { FlightTakeoff, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '📄', title: 'Upload Any Booking', desc: 'PDFs, images of flight tickets, hotel reservations, train and bus bookings — we read them all.' },
  { icon: '🤖', title: 'AI Understands Your Trip', desc: 'Gemini extracts dates, destinations, and details, then crafts a personalised day-by-day plan.' },
  { icon: '🗺️', title: 'Rich Itinerary Instantly', desc: 'Get recommendations, packing lists, budget estimates, and weather tips in seconds.' },
  { icon: '🔗', title: 'Share With One Link', desc: 'Every itinerary gets a public URL. Send it to travel companions with a single click.' },
];

const steps = [
  { n: '01', title: 'Upload your docs', desc: 'Drag and drop your flight, hotel, train, or bus confirmations.' },
  { n: '02', title: 'AI reads and plans', desc: 'Our system extracts the details and sends them to Gemini for planning.' },
  { n: '03', title: 'Get your itinerary', desc: 'Download as PDF, share publicly, or browse day-by-day on screen.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0f1e', overflow: 'hidden' }}>
      <Box component="nav" sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 3, md: 6 }, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlightTakeoff sx={{ color: '#6c63ff', fontSize: 28 }} />
          <Typography sx={{ fontFamily: 'Fraunces, serif', fontSize: '1.4rem', color: '#e8eaf6', fontStyle: 'italic' }}>WanderAI</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isAuthenticated ? (
            <Button variant="contained" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} sx={{ color: '#9ca3af', '&:hover': { color: '#e8eaf6' } }}>Sign in</Button>
              <Button variant="contained" onClick={() => navigate('/register')}>Get started free</Button>
            </>
          )}
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ pt: { xs: 10, md: 16 }, pb: 12, textAlign: 'center' }}>
        <Chip
          icon={<AutoAwesome sx={{ fontSize: '14px !important' }} />}
          label="Powered by Google Gemini AI"
          sx={{ mb: 4, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#9b94ff', fontWeight: 600 }}
        />
        <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5rem' }, lineHeight: 1.1, mb: 3, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          Your travel docs,
          <Box component="span" sx={{
            display: 'block',
            background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            turned into a plan.
          </Box>
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' }, color: '#9ca3af', maxWidth: 560, mx: 'auto', mb: 5, lineHeight: 1.7 }}>
          Upload your booking confirmations and get a complete, AI-generated travel itinerary in under 30 seconds.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" onClick={() => navigate(isAuthenticated ? '/upload' : '/register')} sx={{ px: 5, py: 1.5, fontSize: '1rem' }}>
            Try it free
          </Button>
          <Button size="large" onClick={() => navigate('/login')} sx={{ px: 5, py: 1.5, fontSize: '1rem', border: '1px solid rgba(255,255,255,0.12)', color: '#e8eaf6', '&:hover': { border: '1px solid rgba(108,99,255,0.5)', background: 'rgba(108,99,255,0.08)' } }}>
            Sign in
          </Button>
        </Box>

        <Box sx={{ mt: 10, p: { xs: 3, md: 5 }, borderRadius: 4, background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(255,101,132,0.05))', border: '1px solid rgba(108,99,255,0.2)', maxWidth: 720, mx: 'auto', animation: 'float 4s ease-in-out infinite' }}>
          <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', mb: 2, textAlign: 'left', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sample output</Typography>
          <Typography variant="h4" sx={{ color: '#e8eaf6', mb: 1, fontStyle: 'italic', textAlign: 'left' }}>Paris Autumn Escape</Typography>
          <Typography sx={{ color: '#9ca3af', mb: 3, textAlign: 'left', fontSize: '0.95rem' }}>5-day itinerary · Nov 12-17 · Flights + Hotel included</Typography>
          {['Day 1 — Arrival and Montmartre', 'Day 2 — Louvre and Seine cruise', 'Day 3 — Versailles day trip'].map((d, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', flexShrink: 0 }} />
              <Typography sx={{ color: '#d1d5db', fontSize: '0.95rem' }}>{d}</Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box sx={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" sx={{ textAlign: 'center', fontSize: { xs: '2.2rem', md: '3rem' }, mb: 2, fontStyle: 'italic' }}>Everything you need</Typography>
          <Typography sx={{ textAlign: 'center', color: '#9ca3af', mb: 8, fontSize: '1.1rem' }}>From raw PDFs to a polished travel plan.</Typography>
          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <Box sx={{ p: 3.5, borderRadius: 3, height: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s, transform 0.2s', '&:hover': { borderColor: 'rgba(108,99,255,0.4)', transform: 'translateY(-4px)' } }}>
                  <Typography sx={{ fontSize: '2rem', mb: 2 }}>{f.icon}</Typography>
                  <Typography sx={{ fontWeight: 700, mb: 1.5, color: '#e8eaf6' }}>{f.title}</Typography>
                  <Typography sx={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 12 }}>
        <Typography variant="h2" sx={{ textAlign: 'center', fontSize: { xs: '2.2rem', md: '3rem' }, mb: 2, fontStyle: 'italic' }}>How it works</Typography>
        <Typography sx={{ textAlign: 'center', color: '#9ca3af', mb: 8, fontSize: '1.1rem' }}>Three steps. No setup required.</Typography>
        {steps.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 4, mb: 5, alignItems: 'flex-start' }}>
            <Typography sx={{ fontFamily: 'Fraunces, serif', fontSize: '3rem', color: 'rgba(108,99,255,0.25)', lineHeight: 1, fontWeight: 300, minWidth: 64 }}>{s.n}</Typography>
            <Box sx={{ pt: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5, color: '#e8eaf6' }}>{s.title}</Typography>
              <Typography sx={{ color: '#9ca3af', lineHeight: 1.7 }}>{s.desc}</Typography>
            </Box>
          </Box>
        ))}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button variant="contained" size="large" onClick={() => navigate(isAuthenticated ? '/upload' : '/register')} sx={{ px: 6, py: 1.8, fontSize: '1rem' }}>
            Start planning your trip
          </Button>
        </Box>
      </Container>

      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#4b5563', fontSize: '0.85rem' }}>
          {new Date().getFullYear()} WanderAI - Built with React, Node.js and Google Gemini
        </Typography>
      </Box>
    </Box>
  );
}
