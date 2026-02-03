import { Container, Typography, Box, Grid, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import FaceIcon from '@mui/icons-material/Face';
import UploadIcon from '@mui/icons-material/Upload';
import { getWithAuth } from '../services/apiClient';
import { selfieStorage } from '../services/selfieStorage';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ myPhotos: 0, uploadedPhotos: 0 });
  const [loading, setLoading] = useState(true);
  const hasSelfie = selfieStorage.hasEmbedding();

  useEffect(() => {
    if (!user) return;
    
    getWithAuth('/photos/my')
      .then(({ data }) => {
        setStats({
          myPhotos: data?.length || 0,
          uploadedPhotos: data?.filter(p => p.uploaderSupabaseId === user.id)?.length || 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40 }} />
            Student Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Welcome back, {user.email}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00a86b' }} />
          </Box>
        ) : (
          <>
            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#00a86b', fontWeight: 700, mb: 1 }}>
                      {stats.myPhotos}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Total Photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: '#00a86b', fontWeight: 700, mb: 1 }}>
                      {stats.uploadedPhotos}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Uploaded by Me
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: hasSelfie ? '#00a86b' : '#ff6b6b', fontWeight: 700, mb: 1 }}>
                      {hasSelfie ? '✓' : '✗'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Face Profile
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#00a86b', transform: 'translateY(-4px)' }
                  }}
                  onClick={() => navigate('/face-recognition')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <FaceIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                      {hasSelfie ? 'Update' : 'Upload'} Selfie
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Find yourself in photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#00a86b', transform: 'translateY(-4px)' }
                  }}
                  onClick={() => navigate('/my-photos')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <PhotoLibraryIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                      My Photos
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      View all your photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#00a86b', transform: 'translateY(-4px)' }
                  }}
                  onClick={() => navigate('/upload')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <UploadIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                      Upload Photos
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Share event photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': { borderColor: '#00a86b', transform: 'translateY(-4px)' }
                  }}
                  onClick={() => navigate('/events')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <PhotoLibraryIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                      Browse Events
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      See all event galleries
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {!hasSelfie && (
              <Alert severity="info" sx={{ mt: 4, backgroundColor: '#1a3a4a', color: '#fff', border: '1px solid #00a86b' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  Complete Your Profile
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Upload a selfie to enable automatic face recognition and find yourself in event photos!
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => navigate('/face-recognition')}
                  sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' } }}
                >
                  Upload Selfie Now
                </Button>
              </Alert>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
