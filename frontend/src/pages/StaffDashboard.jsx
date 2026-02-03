import { Container, Typography, Box, Grid, Card, CardContent, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import { getWithAuth, postWithAuth } from '../services/apiClient';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', description: '', date: '', uploadWindowEnd: '' });
  const [regnoInput, setRegnoInput] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [regnoMessage, setRegnoMessage] = useState('');
  const [regnoLoading, setRegnoLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getWithAuth('/dev/stats'),
      getWithAuth('/photos/pending'),
      getWithAuth('/events'),
    ])
      .then(([statsRes, photosRes, eventsRes]) => {
        const statsData = statsRes.data || {};
        setStats({
          total: statsData.totalPhotos || 0,
          pending: photosRes.data?.length || 0,
          approved: statsData.approvedPhotos || 0,
          rejected: statsData.rejectedPhotos || 0,
        });
        setPendingPhotos(photosRes.data || []);
        setEvents(eventsRes.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleApprove = async (photoId) => {
    try {
      console.log(`Approving photo: ${photoId}`);
      const response = await postWithAuth(`/photos/${photoId}/approve`, {});
      console.log('Approve response:', response.data);
      setPendingPhotos(pendingPhotos.filter(p => p._id !== photoId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
      // Refresh stats after successful approval
      const statsRes = await getWithAuth('/dev/stats');
      if (statsRes.data) {
        setStats(prev => ({ ...prev, total: statsRes.data.totalPhotos || 0 }));
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      const message = error.response?.data?.message || error.message;
      alert(`Failed to approve: ${message}`);
    }
  };

  const handleReject = async (photoId, reason = 'Rejected by staff') => {
    try {
      console.log(`Rejecting photo: ${photoId}`);
      await postWithAuth(`/photos/${photoId}/reject`, { reason });
      setPendingPhotos(pendingPhotos.filter(p => p._id !== photoId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    } catch (error) {
      console.error('Failed to reject:', error);
      const message = error.response?.data?.message || error.message;
      alert(`Failed to reject: ${message}`);
    }
  };

  const handleCreateEvent = async () => {
    try {
      await postWithAuth('/events', {
        ...newEvent,
        status: 'upcoming',
      });
      setOpenEventDialog(false);
      setNewEvent({ name: '', description: '', date: '', uploadWindowEnd: '' });
      // Reload events
      const eventsRes = await getWithAuth('/events');
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleGrantUploadAccess = async () => {
    if (!regnoInput.trim()) {
      setRegnoMessage({ type: 'error', text: 'Please enter a registration number' });
      return;
    }

    if (!selectedEventId) {
      setRegnoMessage({ type: 'error', text: 'Please select an event' });
      return;
    }

    setRegnoLoading(true);
    setRegnoMessage('');

    try {
      const res = await postWithAuth('/dev/grant-upload-access', {
        registrationNo: regnoInput,
        eventId: selectedEventId,
      });
      const eventName = events.find(e => e._id === selectedEventId)?.name;
      setRegnoMessage({ type: 'success', text: `✅ ${res.data.student.name} approved for "${eventName}"!` });
      setRegnoInput('');
      setSelectedEventId('');
      setTimeout(() => setRegnoMessage(''), 5000);
    } catch (error) {
      setRegnoMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to grant access' 
      });
    } finally {
      setRegnoLoading(false);
    }
  };

  const handleBackfillEmbeddings = async () => {
    setBackfillLoading(true);
    setBackfillMessage('');
    try {
      const res = await postWithAuth('/photos/backfill-embeddings', {});
      const { processed, noFaces, failed } = res.data;
      setBackfillMessage({
        type: 'success',
        text: `Processed: ${processed} | No faces: ${noFaces} | Failed: ${failed}`
      });
    } catch (error) {
      setBackfillMessage({
        type: 'error',
        text: error.response?.data?.message || 'Backfill failed'
      });
    } finally {
      setBackfillLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#2196f3' }} />
            Staff Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Manage events, students, and approve photos
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00a86b' }} />
          </Box>
        ) : (
          <>
            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Total Photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #ff9800' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 700, mb: 1 }}>
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Pending Review
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#1a3a2a', border: '1px solid #00a86b' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#00a86b', fontWeight: 700, mb: 1 }}>
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Approved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#3a1a1a', border: '1px solid #ff6b6b' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#ff6b6b', fontWeight: 700, mb: 1 }}>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Rejected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: '#333', mb: 3 }}>
              <Tabs 
                value={tab} 
                onChange={(e, v) => setTab(v)}
                sx={{
                  '& .MuiTab-root': { color: '#aaa' },
                  '& .Mui-selected': { color: '#00a86b' },
                  '& .MuiTabs-indicator': { backgroundColor: '#00a86b' }
                }}
              >
                <Tab label="📸 Photos Review" />
                <Tab label="� Approve Students" />
                <Tab label="�📅 Events" />
              </Tabs>
            </Box>

            {/* Photos Review Tab */}
            {tab === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                    Pending Photos for Review ({pendingPhotos.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleBackfillEmbeddings}
                    disabled={backfillLoading}
                    sx={{ 
                      borderColor: '#00a86b', 
                      color: '#00a86b',
                      '&:hover': { borderColor: '#00a86b', backgroundColor: 'rgba(0, 168, 107, 0.1)' }
                    }}
                  >
                    {backfillLoading ? 'Processing...' : 'Generate Missing Face Embeddings'}
                  </Button>
                </Box>

                {backfillMessage && (
                  <Box sx={{ mb: 2, p: 2, backgroundColor: backfillMessage.type === 'success' ? '#1a3a2a' : '#3a1a1a', border: `1px solid ${backfillMessage.type === 'success' ? '#00a86b' : '#ff6b6b'}`, borderRadius: 1 }}>
                    <Typography sx={{ color: '#fff' }}>{backfillMessage.text}</Typography>
                  </Box>
                )}

                {pendingPhotos.length === 0 ? (
                  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        All caught up!
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        No pending photos to review
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Photo</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Uploader</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Date</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingPhotos.map((photo) => (
                          <TableRow key={photo._id}>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                              <Typography variant="body2" sx={{ color: '#fff' }}>
                                {photo.description || 'Untitled'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                              {photo.uploaderName || 'Unknown'}
                            </TableCell>
                            <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #333', textAlign: 'center' }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleApprove(photo._id)}
                                sx={{ backgroundColor: '#00a86b', mr: 1, '&:hover': { backgroundColor: '#008f5b' } }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => handleReject(photo._id)}
                                sx={{ borderColor: '#ff6b6b', color: '#ff6b6b', '&:hover': { backgroundColor: 'rgba(255, 107, 107, 0.1)' } }}
                              >
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* Events Tab */}
            {tab === 1 && (
              <>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 3 }}>
                  Grant Upload Access to Students
                </Typography>

                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333', mb: 4 }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                      Select an event and enter a student's registration number to grant them upload access.
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Select
                        fullWidth
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        displayEmpty
                        sx={{ 
                          backgroundColor: '#0a0a0a', 
                          color: '#fff',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00a86b' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00a86b' }
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Select an event</em>
                        </MenuItem>
                        {events.map((event) => (
                          <MenuItem key={event._id} value={event._id}>
                            {event.name} - {new Date(event.date).toLocaleDateString()}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                      <TextField
                        label="Student Registration Number"
                        value={regnoInput}
                        onChange={(e) => setRegnoInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGrantUploadAccess()}
                        disabled={regnoLoading}
                        sx={{
                          flex: 1,
                          '& .MuiOutlinedInput-root': { color: '#fff' },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleGrantUploadAccess}
                        disabled={regnoLoading}
                        sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' }, height: '56px' }}
                      >
                        {regnoLoading ? 'Granting...' : 'Grant Access'}
                      </Button>
                    </Box>

                    {regnoMessage && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: regnoMessage.type === 'success' ? '#00a86b' : '#ff6b6b',
                          mt: 2
                        }}
                      >
                        {regnoMessage.text}
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                <Typography variant="body2" sx={{ color: '#aaa', mt: 4, p: 2, backgroundColor: '#1a1a1a', borderLeft: '4px solid #00a86b' }}>
                  💡 Students approved for an event can upload photos only for that specific event.
                </Typography>
              </>
            )}

            {/* Events Tab */}
            {tab === 2 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                    Events ({events.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenEventDialog(true)}
                    sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' } }}
                  >
                    Create Event
                  </Button>
                </Box>

                {events.length === 0 ? (
                  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <EventIcon sx={{ fontSize: 60, color: '#aaa', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        No events yet
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Create your first event to get started
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Grid container spacing={3}>
                    {events.map((event) => (
                      <Grid item xs={12} sm={6} md={4} key={event._id}>
                        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333', height: '100%' }}>
                          <CardContent>
                            <Chip
                              label={event.status}
                              size="small"
                              sx={{ 
                                backgroundColor: event.status === 'upcoming' ? '#ff9800' : event.status === 'ongoing' ? '#2196f3' : '#00a86b',
                                color: '#fff',
                                mb: 1
                              }}
                            />
                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                              {event.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                              {event.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#aaa' }}>
                              📅 {new Date(event.date).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Create Event Dialog */}
                <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="sm" fullWidth>
                  <DialogTitle sx={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Create New Event</DialogTitle>
                  <DialogContent sx={{ backgroundColor: '#1a1a1a', pt: 2 }}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      value={newEvent.name}
                      onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' } }}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' } }}
                    />
                    <TextField
                      fullWidth
                      label="Event Date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff' } }}
                    />
                    <TextField
                      fullWidth
                      label="Upload Window End"
                      type="date"
                      value={newEvent.uploadWindowEnd}
                      onChange={(e) => setNewEvent({ ...newEvent, uploadWindowEnd: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { color: '#fff' } }}
                    />
                  </DialogContent>
                  <DialogActions sx={{ backgroundColor: '#1a1a1a', p: 2 }}>
                    <Button onClick={() => setOpenEventDialog(false)} sx={{ color: '#aaa' }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateEvent} 
                      variant="contained"
                      sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' } }}
                    >
                      Create
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

