import { Container, Box, Typography, CircularProgress, Grid, Card, CardMedia, CardContent, Chip, Alert, Button, ImageList, ImageListItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import FaceIcon from '@mui/icons-material/Face';
import DownloadIcon from '@mui/icons-material/Download';
import { getWithAuth, postWithAuth } from '../services/apiClient';
import { selfieStorage } from '../services/selfieStorage';

export default function MyPhotos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasSelfie = selfieStorage.hasEmbedding();

  useEffect(() => {
    if (!user) return;
    
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      // If user has selfie embedding, search for their face
      if (hasSelfie) {
        const embedding = selfieStorage.getEmbedding();
        console.log('🔍 Searching for face matches...');
        const { data } = await postWithAuth('/photos/face-search', { 
          embedding,
          threshold: 0.6  // InsightFace cosine distance threshold (0.6 = more lenient)
        });
        console.log(`✅ Found ${data?.length || 0} matching photos`);
        setPhotos(data || []);
      } else {
        // Otherwise just show photos uploaded by the user
        const { data } = await getWithAuth('/photos/my');
        setPhotos(data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photoUrl, filename) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading photo:', error);
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
            My Photos
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Photos where you've been detected or that you've uploaded
          </Typography>
        </Box>

        {!hasSelfie && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, backgroundColor: '#1a3a4a', color: '#fff', border: '1px solid #00a86b' }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<FaceIcon />}
                onClick={() => navigate('/face-recognition')}
              >
                Upload Selfie
              </Button>
            }
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              Enable Face Recognition
            </Typography>
            <Typography variant="body2">
              Upload a selfie to automatically find yourself in event photos!
            </Typography>
          </Alert>
        )}

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
              <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                {hasSelfie 
                  ? 'Photos where you appear will show up here automatically'
                  : 'Upload a selfie to enable automatic photo detection'}
              </Typography>
              {!hasSelfie && (
                <Button
                  variant="contained"
                  startIcon={<FaceIcon />}
                  onClick={() => navigate('/face-recognition')}
                  sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' } }}
                >
                  Upload Selfie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Found
              </Typography>
            </Box>

            <ImageList variant="masonry" cols={3} gap={16}>
              {photos.map((photo) => (
                <ImageListItem key={photo._id}>
                  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardMedia
                      component="img"
                      image={photo.publicUrl || photo.url}
                      alt={photo.description || 'Event photo'}
                      sx={{ 
                        height: 300, 
                        objectFit: 'cover',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                      onClick={() => window.open(photo.publicUrl || photo.url, '_blank')}
                    />
                    <CardContent>
                      <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                        {photo.eventName || 'Event Photo'}
                      </Typography>
                      {photo.description && (
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                          {photo.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {photo.confidence && (
                          <Chip 
                            label={`${Math.round(photo.confidence * 100)}% match`} 
                            size="small"
                            sx={{ 
                              backgroundColor: '#00a86b',
                              color: '#fff'
                            }}
                          />
                        )}
                        <Chip 
                          label={photo.status || 'approved'} 
                          size="small"
                          sx={{ 
                            backgroundColor: photo.status === 'approved' ? '#00a86b' : '#ff9800',
                            color: '#fff',
                            textTransform: 'capitalize'
                          }}
                        />
                        {photo.uploaderName && (
                          <Chip 
                            label={`By ${photo.uploaderName}`} 
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#333', color: '#aaa' }}
                          />
                        )}
                      </Box>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(photo.publicUrl || photo.url, `photo-${photo.photoId || photo._id}.jpg`)}
                        sx={{ 
                          borderColor: '#00a86b', 
                          color: '#00a86b',
                          '&:hover': { borderColor: '#00a86b', backgroundColor: 'rgba(0, 168, 107, 0.1)' }
                        }}
                      >
                        Download
                      </Button>
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
