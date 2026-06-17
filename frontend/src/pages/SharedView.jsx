import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Grid, Accordion, AccordionSummary,
  AccordionDetails, Alert, Skeleton
} from '@mui/material';
import {
  ExpandMore, FlightTakeoff, Hotel, Train, DirectionsBus,
  AutoAwesome, LightbulbOutlined, ChecklistRtl, Luggage, WbSunny, AttachMoney
} from '@mui/icons-material';
import { shareAPI } from '../services/api';

const transportColor = (t) => ({ flight: '#6c63ff', hotel: '#10b981', train: '#f59e0b', bus: '#ff6584' }[t] || '#9ca3af');
const transportIcon  = (t) => {
  const map = { flight: <FlightTakeoff fontSize="small" />, hotel: <Hotel fontSize="small" />, train: <Train fontSize="small" />, bus: <DirectionsBus fontSize="small" /> };
  return map[t] || <AutoAwesome fontSize="small" />;
};

const BulletList = ({ items, color = '#6c63ff' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {(items || []).map((item, i) => (
      <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color, mt: '7px', flexShrink: 0 }} />
        <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.6 }}>{item}</Typography>
      </Box>
    ))}
  </Box>
);

export default function SharedView() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shareAPI.getByShareId(id);
        setData(res.data.data.itinerary);
      } catch (err) {
        setError(err.message || 'This itinerary is not available or has been made private.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#0a0f1e', p: { xs: 3, md: 6 } }}>
        <Skeleton variant="rounded" height={50} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={150} sx={{ mb: 3, borderRadius: 2 }} />
        {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 2, borderRadius: 2 }} />)}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 1.5, color: '#e8eaf6' }}>Itinerary unavailable</Typography>
          <Typography sx={{ color: '#9ca3af', mb: 4 }}>{error}</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>Go to WanderAI</Button>
        </Box>
      </Box>
    );
  }

  const it    = data?.generatedItinerary || {};
  const types = [...new Set((data?.extractedData || []).map(d => d.documentType).filter(Boolean))];

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0f1e' }}>
      {/* NAV */}
      <Box sx={{
        px: { xs: 3, md: 6 }, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <FlightTakeoff sx={{ color: '#6c63ff', fontSize: 24 }} />
          <Typography sx={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', color: '#e8eaf6', fontStyle: 'italic' }}>WanderAI</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label="Shared itinerary" size="small" sx={{ background: 'rgba(108,99,255,0.15)', color: '#9b94ff', border: '1px solid rgba(108,99,255,0.3)', fontSize: '0.78rem' }} />
          <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            Create your own
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>
        {/* SHARED BY */}
        {data?.userId?.name && (
          <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', mb: 3 }}>
            Shared by <span style={{ color: '#9b94ff', fontWeight: 600 }}>{data.userId.name}</span>
          </Typography>
        )}

        {/* HERO */}
        <Box sx={{
          p: { xs: 3, md: 5 }, borderRadius: 4, mb: 5,
          background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(255,101,132,0.06))',
          border: '1px solid rgba(108,99,255,0.25)',
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
            {types.map(t => (
              <Chip key={t} icon={transportIcon(t)} label={t} size="small"
                sx={{ background: `${transportColor(t)}18`, color: transportColor(t), border: `1px solid ${transportColor(t)}33`, '& .MuiChip-icon': { color: transportColor(t) } }} />
            ))}
          </Box>
          <Typography variant="h3" sx={{ fontStyle: 'italic', fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1, lineHeight: 1.2 }}>
            {it.tripTitle || 'My Trip'}
          </Typography>
          <Typography sx={{ color: '#9b94ff', fontWeight: 600, mb: 0.5 }}>{it.destination}</Typography>
          {it.startDate && (
            <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {it.startDate}{it.endDate && it.endDate !== it.startDate ? ` — ${it.endDate}` : ''}{it.duration ? ` · ${it.duration} days` : ''}
            </Typography>
          )}
          {it.summary && (
            <Typography sx={{ color: '#9ca3af', mt: 2.5, lineHeight: 1.8, maxWidth: 680, fontSize: '0.95rem' }}>
              {it.summary}
            </Typography>
          )}
        </Box>

        {/* DAY BY DAY */}
        {it.itineraryDays?.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 3 }}>Day-by-Day Plan</Typography>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', left: 19, top: 28, bottom: 28, width: 2, background: 'linear-gradient(180deg, #6c63ff, rgba(108,99,255,0.1))', borderRadius: 1 }} />
              {it.itineraryDays.map((day, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 3, mb: 2 }}>
                  <Box sx={{ flexShrink: 0, position: 'relative', zIndex: 1, pt: 1 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #9b94ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', color: '#fff',
                      boxShadow: '0 0 0 3px #0a0f1e, 0 0 0 5px rgba(108,99,255,0.3)',
                    }}>
                      {day.day}
                    </Box>
                  </Box>
                  <Accordion disableGutters defaultExpanded={i === 0} sx={{
                    flex: 1, background: '#111827', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px !important', mb: 0, '&:before': { display: 'none' },
                  }}>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />} sx={{ px: 2.5, minHeight: 56 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#e8eaf6', fontSize: '0.95rem' }}>
                          Day {day.day}{day.date ? ` · ${day.date}` : ''}{day.title ? ` — ${day.title}` : ''}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
                      {day.description && (
                        <Typography sx={{ color: '#9ca3af', mb: 2, fontSize: '0.9rem', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid rgba(108,99,255,0.4)', pl: 2 }}>
                          {day.description}
                        </Typography>
                      )}
                      {day.activities?.length > 0 && <BulletList items={day.activities} color="#6c63ff" />}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* INFO GRID */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { show: it.recommendations?.length, icon: <LightbulbOutlined />, title: 'Recommendations', items: it.recommendations, color: '#f59e0b' },
            { show: it.reminders?.length, icon: <ChecklistRtl />, title: 'Reminders', items: it.reminders, color: '#ff6584' },
            { show: it.packingSuggestions?.length, icon: <Luggage />, title: 'Packing List', items: it.packingSuggestions, color: '#6c63ff' },
          ].filter(s => s.show).map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Box sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, color: s.color }}>{s.icon}
                  <Typography sx={{ fontWeight: 700, color: '#e8eaf6' }}>{s.title}</Typography>
                </Box>
                <BulletList items={s.items} color={s.color} />
              </Box>
            </Grid>
          ))}
          {(it.weatherInfo || it.estimatedBudget) && (
            <Grid item xs={12} md={6}>
              {it.weatherInfo && (
                <Box sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, color: '#10b981' }}><WbSunny />
                    <Typography sx={{ fontWeight: 700, color: '#e8eaf6' }}>Weather</Typography>
                  </Box>
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.weatherInfo}</Typography>
                </Box>
              )}
              {it.estimatedBudget && (
                <Box sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, color: '#10b981' }}><AttachMoney />
                    <Typography sx={{ fontWeight: 700, color: '#e8eaf6' }}>Budget</Typography>
                  </Box>
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.estimatedBudget}</Typography>
                </Box>
              )}
            </Grid>
          )}
        </Grid>

        {/* CTA */}
        <Box sx={{ p: 4, borderRadius: 3, background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,101,132,0.06))', border: '1px solid rgba(108,99,255,0.2)', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 1 }}>Plan your own trip with AI</Typography>
          <Typography sx={{ color: '#9ca3af', mb: 3, fontSize: '0.95rem' }}>Upload your travel bookings and get a beautiful itinerary in seconds.</Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/register')} sx={{ px: 5 }}>
            Try WanderAI for free
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
