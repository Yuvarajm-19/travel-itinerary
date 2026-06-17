import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Grid, Accordion, AccordionSummary,
  AccordionDetails, Alert, Skeleton, IconButton, Tooltip, Divider, Tab, Tabs
} from '@mui/material';
import {
  ExpandMore, FlightTakeoff, Hotel, Train, DirectionsBus, ArrowBack,
  ContentCopy, Check, Share, Download, LightbulbOutlined, ChecklistRtl,
  Luggage, WbSunny, AttachMoney, AutoAwesome
} from '@mui/icons-material';
import AppLayout from '../components/layout/AppLayout';
import { itineraryAPI } from '../services/api';

const SectionCard = ({ icon, title, children, accent = '#6c63ff' }) => (
  <Box sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, color: '#e8eaf6' }}>{title}</Typography>
    </Box>
    {children}
  </Box>
);

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

const transportIcon = (docType) => {
  const map = { flight: <FlightTakeoff fontSize="small" />, hotel: <Hotel fontSize="small" />, train: <Train fontSize="small" />, bus: <DirectionsBus fontSize="small" /> };
  return map[docType] || <AutoAwesome fontSize="small" />;
};

const transportColor = (docType) => ({ flight: '#6c63ff', hotel: '#10b981', train: '#f59e0b', bus: '#ff6584' }[docType] || '#9ca3af');

function Timeline({ days }) {
  if (!days?.length) return null;
  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'absolute', left: 19, top: 28, bottom: 28, width: 2, background: 'linear-gradient(180deg, #6c63ff, rgba(108,99,255,0.1))', borderRadius: 1 }} />
      {days.map((day, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
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
            '&.Mui-expanded': { borderColor: 'rgba(108,99,255,0.3)' },
          }}>
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#6b7280' }} />} sx={{ px: 2.5, py: 0.5, minHeight: 56 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 700, color: '#e8eaf6', fontSize: '0.95rem' }}>
                    Day {day.day}{day.date ? ` · ${day.date}` : ''}
                  </Typography>
                  {day.title && (
                    <Typography sx={{ color: '#9b94ff', fontSize: '0.85rem', fontStyle: 'italic' }}>{day.title}</Typography>
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5 }}>
              {day.description && (
                <Typography sx={{ color: '#9ca3af', mb: 2.5, fontSize: '0.9rem', lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid rgba(108,99,255,0.4)', pl: 2 }}>
                  {day.description}
                </Typography>
              )}
              <Grid container spacing={2}>
                {day.activities?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#9b94ff', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activities</Typography>
                    <BulletList items={day.activities} color="#6c63ff" />
                  </Grid>
                )}
                {day.meals?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Meals</Typography>
                    <BulletList items={day.meals} color="#10b981" />
                  </Grid>
                )}
                {day.transport?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transport</Typography>
                    <BulletList items={day.transport} color="#f59e0b" />
                  </Grid>
                )}
                {day.tips?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#ff6584', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tips</Typography>
                    <BulletList items={day.tips} color="#ff6584" />
                  </Grid>
                )}
                {day.accommodation && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mt: 0.5, p: 1.5, background: 'rgba(16,185,129,0.07)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.15)' }}>
                      <Hotel fontSize="small" sx={{ color: '#10b981', mt: 0.2 }} />
                      <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem' }}>{day.accommodation}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      ))}
    </Box>
  );
}

export default function ItineraryPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [tab, setTab]         = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await itineraryAPI.getOne(id);
        setData(res.data.data.itinerary);
      } catch (err) {
        setError(err.message || 'Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${data.shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = () => {
    const it = data.generatedItinerary;
    const lines = [
      `${it.tripTitle || 'My Trip'}`,
      `Destination: ${it.destination || 'N/A'}`,
      `Dates: ${it.startDate || ''} - ${it.endDate || ''}`,
      `Duration: ${it.duration || ''} days`,
      '',
      'SUMMARY',
      it.summary || '',
      '',
      'DAY-BY-DAY ITINERARY',
      ...(it.itineraryDays || []).flatMap(d => [
        `Day ${d.day}${d.date ? ' - ' + d.date : ''}: ${d.title || ''}`,
        d.description || '',
        d.activities?.length ? 'Activities: ' + d.activities.join(', ') : '',
        d.meals?.length ? 'Meals: ' + d.meals.join(', ') : '',
        d.transport?.length ? 'Transport: ' + d.transport.join(', ') : '',
        d.accommodation ? 'Stay: ' + d.accommodation : '',
        '',
      ]),
      'RECOMMENDATIONS',
      ...(it.recommendations || []).map(r => `• ${r}`),
      '',
      'PACKING LIST',
      ...(it.packingSuggestions || []).map(p => `• ${p}`),
      '',
      'REMINDERS',
      ...(it.reminders || []).map(r => `• ${r}`),
    ];
    const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${it.tripTitle || 'itinerary'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
          <Skeleton variant="rounded" height={60} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 2 }} />
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 2, borderRadius: 2 }} />)}
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 960, mx: 'auto', px: 4, py: 6 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>Back to Dashboard</Button>
        </Box>
      </AppLayout>
    );
  }

  const it    = data?.generatedItinerary || {};
  const docs  = data?.extractedData || [];
  const types = [...new Set(docs.map(d => d.documentType).filter(Boolean))];

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>
        {/* BACK */}
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: '#9ca3af', mb: 3, '&:hover': { color: '#e8eaf6' } }}>
          Back to Dashboard
        </Button>

        {/* HERO */}
        <Box sx={{
          p: { xs: 3, md: 5 }, borderRadius: 4, mb: 4,
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
          <Typography sx={{ color: '#9b94ff', fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>{it.destination}</Typography>
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

          {/* ACTIONS */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3.5, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={copied ? <Check /> : <ContentCopy />} onClick={handleCopyLink}
              sx={{ background: copied ? '#10b981' : undefined }}>
              {copied ? 'Copied!' : 'Copy Share Link'}
            </Button>
            <Button startIcon={<Download />} onClick={handleDownloadPDF}
              sx={{ border: '1px solid rgba(255,255,255,0.12)', color: '#e8eaf6', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
              Download
            </Button>
            <Button startIcon={<Share />} href={`/share/${data.shareId}`} target="_blank"
              sx={{ border: '1px solid rgba(255,255,255,0.12)', color: '#e8eaf6', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
              Open public view
            </Button>
          </Box>
        </Box>

        {/* TABS */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
          mb: 4, borderBottom: '1px solid rgba(255,255,255,0.06)',
          '& .MuiTab-root': { color: '#6b7280', fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' },
          '& .Mui-selected': { color: '#9b94ff !important' },
          '& .MuiTabs-indicator': { background: '#6c63ff' },
        }}>
          <Tab label="Itinerary" />
          <Tab label="Info &amp; Tips" />
          <Tab label="Bookings" />
        </Tabs>

        {/* TAB 0 — TIMELINE */}
        {tab === 0 && (
          it.itineraryDays?.length > 0
            ? <Timeline days={it.itineraryDays} />
            : <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography sx={{ color: '#6b7280' }}>No day-by-day breakdown available.</Typography>
              </Box>
        )}

        {/* TAB 1 — INFO */}
        {tab === 1 && (
          <Grid container spacing={3}>
            {it.recommendations?.length > 0 && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<LightbulbOutlined />} title="Recommendations" accent="#f59e0b">
                  <BulletList items={it.recommendations} color="#f59e0b" />
                </SectionCard>
              </Grid>
            )}
            {it.packingSuggestions?.length > 0 && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<Luggage />} title="Packing Suggestions" accent="#6c63ff">
                  <BulletList items={it.packingSuggestions} color="#6c63ff" />
                </SectionCard>
              </Grid>
            )}
            {it.reminders?.length > 0 && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<ChecklistRtl />} title="Important Reminders" accent="#ff6584">
                  <BulletList items={it.reminders} color="#ff6584" />
                </SectionCard>
              </Grid>
            )}
            {it.weatherInfo && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<WbSunny />} title="Weather &amp; Clothing" accent="#10b981">
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.weatherInfo}</Typography>
                </SectionCard>
              </Grid>
            )}
            {it.estimatedBudget && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<AttachMoney />} title="Estimated Budget" accent="#10b981">
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.estimatedBudget}</Typography>
                </SectionCard>
              </Grid>
            )}
            {it.accommodationDetails && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<Hotel />} title="Accommodation Details" accent="#10b981">
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.accommodationDetails}</Typography>
                </SectionCard>
              </Grid>
            )}
            {it.transportationDetails && (
              <Grid item xs={12} md={6}>
                <SectionCard icon={<FlightTakeoff />} title="Transportation Details" accent="#9b94ff">
                  <Typography sx={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7 }}>{it.transportationDetails}</Typography>
                </SectionCard>
              </Grid>
            )}
          </Grid>
        )}

        {/* TAB 2 — BOOKINGS */}
        {tab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {docs.length === 0
              ? <Typography sx={{ color: '#6b7280', py: 4, textAlign: 'center' }}>No booking data available.</Typography>
              : docs.map((doc, i) => (
                  <Box key={i} sx={{ p: 3, borderRadius: 3, background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ color: transportColor(doc.documentType) }}>{transportIcon(doc.documentType)}</Box>
                      <Chip label={doc.documentType} size="small"
                        sx={{ background: `${transportColor(doc.documentType)}18`, color: transportColor(doc.documentType) }} />
                      {doc.fileName && <Typography sx={{ color: '#6b7280', fontSize: '0.8rem', ml: 'auto' }}>{doc.fileName}</Typography>}
                    </Box>
                    <Grid container spacing={1.5}>
                      {doc.flight && Object.entries(doc.flight).filter(([,v]) => v).map(([k, v]) => (
                        <Grid item xs={6} sm={4} key={k}>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</Typography>
                          <Typography sx={{ color: '#e8eaf6', fontSize: '0.9rem', fontWeight: 600 }}>{v}</Typography>
                        </Grid>
                      ))}
                      {doc.hotel && Object.entries(doc.hotel).filter(([,v]) => v).map(([k, v]) => (
                        <Grid item xs={6} sm={4} key={k}>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</Typography>
                          <Typography sx={{ color: '#e8eaf6', fontSize: '0.9rem', fontWeight: 600 }}>{v}</Typography>
                        </Grid>
                      ))}
                      {doc.train && Object.entries(doc.train).filter(([,v]) => v).map(([k, v]) => (
                        <Grid item xs={6} sm={4} key={k}>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</Typography>
                          <Typography sx={{ color: '#e8eaf6', fontSize: '0.9rem', fontWeight: 600 }}>{v}</Typography>
                        </Grid>
                      ))}
                      {doc.bus && Object.entries(doc.bus).filter(([,v]) => v).map(([k, v]) => (
                        <Grid item xs={6} sm={4} key={k}>
                          <Typography sx={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</Typography>
                          <Typography sx={{ color: '#e8eaf6', fontSize: '0.9rem', fontWeight: 600 }}>{v}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))
            }
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
