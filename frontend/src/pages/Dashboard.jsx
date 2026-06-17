import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions,
  TextField, InputAdornment, IconButton, Chip, Skeleton, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
  Add, Search, Delete, OpenInNew, Share, FlightTakeoff,
  Hotel, Train, DirectionsBus, ContentCopy, Check, TravelExplore
} from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { itineraryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon, color }) => (
  <Box sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 3 }}>
    <Box sx={{ width: 52, height: 52, borderRadius: 2, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 26 }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#e8eaf6', lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', mt: 0.5 }}>{label}</Typography>
    </Box>
  </Box>
);

const docTypeIcon = (type) => {
  const map = { flight: <FlightTakeoff fontSize="small" />, hotel: <Hotel fontSize="small" />, train: <Train fontSize="small" />, bus: <DirectionsBus fontSize="small" /> };
  return map[type] || <TravelExplore fontSize="small" />;
};

const docTypeColor = (type) => {
  const map = { flight: '#6c63ff', hotel: '#10b981', train: '#f59e0b', bus: '#ff6584' };
  return map[type] || '#6b7280';
};

function TripCard({ trip, onDelete, onCopyLink }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/share/${trip.shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyLink && onCopyLink(url);
  };

  const dest = trip.generatedItinerary?.destination || 'Unknown destination';
  const title = trip.generatedItinerary?.tripTitle || trip.title || 'My Trip';
  const start = trip.generatedItinerary?.startDate;
  const end   = trip.generatedItinerary?.endDate;
  const types = [...new Set((trip.extractedData || []).map(d => d?.documentType).filter(Boolean))];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'rgba(108,99,255,0.4)', transform: 'translateY(-3px)', boxShadow: '0 12px 40px rgba(108,99,255,0.15)' } }}
      onClick={() => navigate(`/itinerary/${trip._id}`)}>
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {types.map(t => (
            <Chip key={t} icon={docTypeIcon(t)} label={t} size="small"
              sx={{ background: `${docTypeColor(t)}18`, color: docTypeColor(t), border: `1px solid ${docTypeColor(t)}33`, '& .MuiChip-icon': { color: docTypeColor(t) } }} />
          ))}
        </Box>
        <Typography sx={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.2rem', color: '#e8eaf6', mb: 0.5, lineHeight: 1.3 }}>
          {title.length > 50 ? title.slice(0, 50) + '...' : title}
        </Typography>
        <Typography sx={{ color: '#9b94ff', fontSize: '0.85rem', mb: 1.5, fontWeight: 600 }}>
          {dest}
        </Typography>
        {start && (
          <Typography sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
            {start}{end && end !== start ? ` — ${end}` : ''}
          </Typography>
        )}
        <Typography sx={{ color: '#6b7280', fontSize: '0.78rem', mt: 1 }}>
          {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
        <Button size="small" startIcon={<OpenInNew fontSize="small" />} onClick={(e) => { e.stopPropagation(); navigate(`/itinerary/${trip._id}`); }}
          sx={{ color: '#9b94ff', fontSize: '0.8rem' }}>View</Button>
        <Tooltip title={copied ? 'Copied!' : 'Copy share link'}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? '#10b981' : '#6b7280', ml: 'auto' }}>
            {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete trip">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(trip._id); }} sx={{ color: '#6b7280', '&:hover': { color: '#ef4444' } }}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [trips, setTrips]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState('');

  const fetchData = useCallback(async (q = '', p = 1) => {
    setLoading(true);
    try {
      const [tripsRes, statsRes] = await Promise.all([
        itineraryAPI.getAll({ page: p, limit: 12, search: q }),
        itineraryAPI.getStats(),
      ]);
      setTrips(tripsRes.data.data.itineraries);
      setPagination(tripsRes.data.data.pagination);
      setStats(statsRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (search === '') {
      fetchData('', 1);
      return;
    }

    const t = setTimeout(() => {
      setPage(1);
      fetchData(search, 1);
    }, 400);

    return () => clearTimeout(t);
  }, [search, fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await itineraryAPI.remove(deleteId);
      setDeleteId(null);
      fetchData(search, page);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const totalTrips = stats?.totalTrips ?? 0;
  const docTypeCounts = (stats?.documentTypes || []).reduce((acc, d) => { acc[d._id] = d.count; return acc; }, {});

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 5, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontStyle: 'italic', mb: 0.5 }}>
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} ✈️
            </Typography>
            <Typography sx={{ color: '#9ca3af' }}>Here are your travel plans</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/upload')} sx={{ px: 3 }}>
            New Trip
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* STATS */}
        <Grid container spacing={2.5} sx={{ mb: 5 }}>
          {[
            { label: 'Total Trips', value: totalTrips, icon: <TravelExplore />, color: '#6c63ff' },
            { label: 'Flights Tracked', value: docTypeCounts.flight || 0, icon: <FlightTakeoff />, color: '#9b94ff' },
            { label: 'Hotels Booked', value: docTypeCounts.hotel || 0, icon: <Hotel />, color: '#10b981' },
            { label: 'Train Journeys', value: docTypeCounts.train || 0, icon: <Train />, color: '#f59e0b' },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              {loading ? <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} /> : <StatCard {...s} />}
            </Grid>
          ))}
        </Grid>

        {/* SEARCH */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth placeholder="Search trips by title or destination..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#6b7280' }} /></InputAdornment> }}
            sx={{ maxWidth: 480 }}
          />
        </Box>

        {/* TRIPS GRID */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : trips.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>🌍</Typography>
            <Typography variant="h5" sx={{ fontStyle: 'italic', mb: 1.5, color: '#e8eaf6' }}>
              {search ? 'No trips match your search' : 'No trips yet'}
            </Typography>
            <Typography sx={{ color: '#9ca3af', mb: 4 }}>
              {search ? 'Try a different search term.' : 'Upload your first travel booking and let AI plan your trip.'}
            </Typography>
            {!search && (
              <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/upload')}>
                Upload your first booking
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {trips.map((trip) => (
                <Grid item xs={12} sm={6} md={4} key={trip._id}>
                  <TripCard trip={trip} onDelete={(id) => setDeleteId(id)} />
                </Grid>
              ))}
            </Grid>

            {pagination && pagination.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 5 }}>
                <Button disabled={!pagination.hasPrev} onClick={() => { const np = page - 1; setPage(np); fetchData(search, np); }} sx={{ color: '#9ca3af' }}>Previous</Button>
                <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, color: '#6b7280', fontSize: '0.9rem' }}>
                  {page} / {pagination.pages}
                </Typography>
                <Button disabled={!pagination.hasNext} onClick={() => { const np = page + 1; setPage(np); fetchData(search, np); }} sx={{ color: '#9ca3af' }}>Next</Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* DELETE CONFIRM */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>Delete this trip?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9ca3af' }}>This action cannot be undone. The itinerary will be permanently deleted.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#9ca3af' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} disabled={deleting} sx={{ background: '#ef4444', '&:hover': { background: '#dc2626' } }}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
