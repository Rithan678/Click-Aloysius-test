import { Container, Box, Typography, CircularProgress, Grid, Card, CardContent, CardMedia, Button, Chip, Alert, ImageList, ImageListItem, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EventIcon from '@mui/icons-material/Event';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getWithAuth } from '../services/apiClient';

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data } = await getWithAuth('/events');
      setEvents(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventPhotos = async (eventId) => {
    try {
      setPhotosLoading(true);
      const { data } = await getWithAuth(`/photos/event/${eventId}`);
      setEventPhotos(data || []);
    } catch (err) {
      console.error('Error loading event photos:', err);
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
    await loadEventPhotos(event._id);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
    setEventPhotos([]);
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
            <EventIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#00a86b' }} />
            Browse Events
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            View all events and their photo galleries
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00a86b' }} />
          </Box>
        ) : events.length === 0 ? (
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <EventIcon sx={{ fontSize: 80, color: '#333', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                No Events Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Events will appear here once created
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#00a86b', transform: 'translateY(-4px)' }
                  }}
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EventIcon sx={{ fontSize: 40, color: '#00a86b', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 0.5 }}>
                          {event.name}
                        </Typography>
                        <Chip 
                          label={event.status} 
                          size="small"
                          sx={{ 
                            backgroundColor: 
                              event.status === 'completed' ? '#00a86b' : 
                              event.status === 'ongoing' ? '#ff9800' : '#2196f3',
                            color: '#fff',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </Box>

                    {event.description && (
                      <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                        {event.description}
                      </Typography>
                    )}

                    {event.date && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: '#666' }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {new Date(event.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PhotoLibraryIcon />}
                      sx={{ 
                        borderColor: '#00a86b', 
                        color: '#00a86b',
                        '&:hover': { borderColor: '#00a86b', backgroundColor: 'rgba(0, 168, 107, 0.1)' }
                      }}
                    >
                      View Photos
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Event Photos Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { backgroundColor: '#1a1a1a', border: '1px solid #333' }
          }}
        >
          <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1, color: '#00a86b' }} />
              {selectedEvent?.name}
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedEvent?.description && (
              <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                {selectedEvent.description}
              </Typography>
            )}

            {photosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#00a86b' }} />
              </Box>
            ) : eventPhotos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PhotoLibraryIcon sx={{ fontSize: 60, color: '#333', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#aaa' }}>
                  No photos in this event yet
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                  {eventPhotos.length} {eventPhotos.length === 1 ? 'Photo' : 'Photos'}
                </Typography>
                <ImageList variant="masonry" cols={3} gap={8}>
                  {eventPhotos.map((photo) => (
                    <ImageListItem key={photo._id}>
                      <img
                        src={photo.publicUrl}
                        alt={photo.description || 'Event photo'}
                        loading="lazy"
                        style={{ 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          border: '1px solid #333'
                        }}
                        onClick={() => window.open(photo.publicUrl, '_blank')}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}
