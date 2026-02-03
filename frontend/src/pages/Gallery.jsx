import { Container, Box, Typography, CircularProgress, ImageList, ImageListItem, Card, CardMedia, CardContent, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { getWithAuth } from '../services/apiClient';

export default function Gallery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      // Get all approved photos from all events
      const { data: stats } = await getWithAuth('/dev/stats');
      
      // For now, let's get all photos (you can filter by event later)
      const { data } = await getWithAuth('/photos/all');
      setPhotos(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
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
            <PhotoLibraryIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#00a86b' }} />
            Photo Gallery
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            All approved event photos
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
        ) : photos.length === 0 ? (
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <PhotoLibraryIcon sx={{ fontSize: 80, color: '#333', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                No Photos Yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Approved photos will appear here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </Typography>
            </Box>

            <ImageList variant="masonry" cols={3} gap={16}>
              {photos.map((photo) => (
                <ImageListItem key={photo._id}>
                  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardMedia
                      component="img"
                      image={photo.publicUrl}
                      alt={photo.description || 'Event photo'}
                      sx={{ 
                        height: 300, 
                        objectFit: 'cover',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                      onClick={() => window.open(photo.publicUrl, '_blank')}
                    />
                    <CardContent>
                      {photo.description && (
                        <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                          {photo.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={photo.status} 
                          size="small"
                          sx={{ 
                            backgroundColor: photo.status === 'approved' ? '#00a86b' : '#ff9800',
                            color: '#fff',
                            textTransform: 'capitalize'
                          }}
                        />
                        {photo.uploaderName && (
                          <Chip 
                            label={photo.uploaderName} 
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#333', color: '#aaa' }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </ImageListItem>
              ))}
            </ImageList>
          </>
        )}
      </Container>
    </Box>
  );
}
