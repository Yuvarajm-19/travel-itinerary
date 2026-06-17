import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box, Typography, Button, LinearProgress, Alert, Chip,
  List, ListItem, ListItemIcon, ListItemText, IconButton
} from '@mui/material';
import {
  CloudUpload, PictureAsPdf, Image, Close, FlightTakeoff,
  Hotel, Train, DirectionsBus, AutoAwesome, CheckCircle, Error
} from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { uploadAPI, itineraryAPI } from '../services/api';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] };

const docIcon = (type) => ({ flight: <FlightTakeoff sx={{ color: '#6c63ff' }} />, hotel: <Hotel sx={{ color: '#10b981' }} />, train: <Train sx={{ color: '#f59e0b' }} />, bus: <DirectionsBus sx={{ color: '#ff6584' }} /> }[type] || <AutoAwesome sx={{ color: '#9ca3af' }} />);

const formatSize = (bytes) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const STAGES = ['idle', 'uploading', 'processing', 'generating', 'done', 'error'];

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles]           = useState([]);
  const [stage, setStage]           = useState('idle');
  const [uploadPct, setUploadPct]   = useState(0);
  const [extracted, setExtracted]   = useState([]);
  const [error, setError]           = useState('');

  const onDrop = useCallback((accepted, rejected) => {
    setError('');
    if (rejected.length) {
      const reasons = rejected.map(r => r.errors[0]?.message).join(', ');
      setError(`Some files rejected: ${reasons}`);
    }
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const newFiles = accepted.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...newFiles].slice(0, 10);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxSize: MAX_SIZE, multiple: true,
  });

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!files.length) return;
    setError('');
    setStage('uploading');
    setUploadPct(0);

    const formData = new FormData();
    files.forEach(f => formData.append('documents', f));

    let extractedData;
    try {
      setStage('uploading');
      const res = await uploadAPI.uploadDocuments(formData, setUploadPct);
      extractedData = res.data.data.results;
      setExtracted(extractedData);
      setStage('generating');
    } catch (err) {
      setError(err.message || 'Upload failed');
      setStage('error');
      return;
    }

    try {
      const res = await itineraryAPI.generate({ extractedData });
      const id  = res.data.data.itinerary._id;
      setStage('done');
      setTimeout(() => navigate(`/itinerary/${id}`), 800);
    } catch (err) {
      setError(err.message || 'AI generation failed');
      setStage('error');
    }
  };

  const reset = () => { setFiles([]); setStage('idle'); setError(''); setExtracted([]); setUploadPct(0); };

  const busy = ['uploading', 'processing', 'generating'].includes(stage);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, fontStyle: 'italic', mb: 0.5 }}>
            Upload your bookings
          </Typography>
          <Typography sx={{ color: '#9ca3af' }}>
            Drop your flight tickets, hotel reservations, or any travel confirmation — up to 10 files.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* DROPZONE */}
        {stage === 'idle' && (
          <>
            <Box {...getRootProps()} sx={{
              border: `2px dashed ${isDragActive ? '#6c63ff' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 3, p: { xs: 5, md: 8 }, textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(108,99,255,0.5)', background: 'rgba(108,99,255,0.05)' },
            }}>
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 56, color: isDragActive ? '#6c63ff' : '#374151', mb: 2 }} />
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: isDragActive ? '#9b94ff' : '#e8eaf6', mb: 1 }}>
                {isDragActive ? 'Drop your files here' : 'Drag and drop your travel docs'}
              </Typography>
              <Typography sx={{ color: '#6b7280', mb: 3, fontSize: '0.9rem' }}>
                or click to browse — PDF, JPG, JPEG, PNG · max 10 MB each
              </Typography>
              <Button variant="outlined" sx={{ borderColor: 'rgba(108,99,255,0.5)', color: '#9b94ff' }}>
                Browse files
              </Button>
            </Box>

            {/* FILE LIST */}
            {files.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ color: '#9ca3af', fontSize: '0.85rem', mb: 1.5, fontWeight: 600 }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </Typography>
                <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {files.map((file, i) => (
                    <ListItem key={i} sx={{ background: '#111827', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', px: 2, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {file.type === 'application/pdf' ? <PictureAsPdf sx={{ color: '#ef4444' }} /> : <Image sx={{ color: '#6c63ff' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={formatSize(file.size)}
                        primaryTypographyProps={{ fontSize: '0.9rem', color: '#e8eaf6' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem', color: '#6b7280' }}
                      />
                      <IconButton size="small" onClick={() => removeFile(i)} sx={{ color: '#6b7280', '&:hover': { color: '#ef4444' } }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button variant="contained" size="large" onClick={handleUpload} startIcon={<AutoAwesome />} sx={{ flex: 1, py: 1.5 }}>
                    Generate My Itinerary
                  </Button>
                  <Button onClick={reset} sx={{ color: '#6b7280' }}>Clear all</Button>
                </Box>
              </Box>
            )}
          </>
        )}

        {/* PROGRESS STATES */}
        {stage === 'uploading' && (
          <Box sx={{ p: 5, background: '#111827', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 48, color: '#6c63ff', mb: 2 }} />
            <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '1.1rem' }}>Uploading documents...</Typography>
            <LinearProgress variant="determinate" value={uploadPct} sx={{ borderRadius: 2, height: 6, background: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6c63ff, #9b94ff)' } }} />
            <Typography sx={{ color: '#6b7280', mt: 1.5, fontSize: '0.85rem' }}>{uploadPct}%</Typography>
          </Box>
        )}

        {stage === 'generating' && (
          <Box sx={{ p: 5, background: '#111827', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <AutoAwesome sx={{ fontSize: 48, color: '#6c63ff', mb: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <Typography sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>AI is crafting your itinerary...</Typography>
            <Typography sx={{ color: '#9ca3af', mb: 3, fontSize: '0.9rem' }}>This usually takes 10–20 seconds</Typography>
            {extracted.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {extracted.map((doc, i) => (
                  <Chip key={i} icon={docIcon(doc.documentType)} label={doc.documentType || 'document'}
                    sx={{ background: 'rgba(108,99,255,0.12)', color: '#9b94ff', border: '1px solid rgba(108,99,255,0.2)' }} />
                ))}
              </Box>
            )}
            <LinearProgress sx={{ mt: 3, borderRadius: 2, height: 4, background: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6c63ff, #ff6584)' } }} />
          </Box>
        )}

        {stage === 'done' && (
          <Box sx={{ p: 5, background: '#111827', borderRadius: 3, border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 56, color: '#10b981', mb: 2 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#10b981' }}>Itinerary generated!</Typography>
            <Typography sx={{ color: '#9ca3af', mt: 1 }}>Redirecting you now...</Typography>
          </Box>
        )}

        {stage === 'error' && (
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={reset} sx={{ mr: 2 }}>Try Again</Button>
            <Button onClick={() => navigate('/dashboard')} sx={{ color: '#9ca3af' }}>Back to Dashboard</Button>
          </Box>
        )}

        {/* TIPS */}
        {stage === 'idle' && files.length === 0 && (
          <Box sx={{ mt: 4, p: 3, borderRadius: 2, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)' }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5, color: '#9b94ff', fontSize: '0.9rem' }}>Accepted document types</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[{ icon: <FlightTakeoff fontSize="small" />, label: 'Flight ticket' }, { icon: <Hotel fontSize="small" />, label: 'Hotel booking' }, { icon: <Train fontSize="small" />, label: 'Train ticket' }, { icon: <DirectionsBus fontSize="small" />, label: 'Bus ticket' }].map(t => (
                <Chip key={t.label} icon={t.icon} label={t.label} size="small" sx={{ background: 'rgba(255,255,255,0.05)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.08)' }} />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
