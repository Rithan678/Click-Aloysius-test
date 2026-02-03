import { Container, Typography, Button, Box, Grid, Card, CardContent, Stack, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import SecurityIcon from '@mui/icons-material/Security';
import FaceIcon from '@mui/icons-material/Face';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function Home() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [checked, setChecked] = useState(false);

  // Redirect to appropriate dashboard if logged in
  useEffect(() => {
    if (user && !checked) {
      setChecked(true);
      console.log('👤 Initial user state:', user);
      
      // Refresh user data to get latest role from server
      refreshUser().then((updatedUser) => {
        console.log('🔄 After refreshUser - updatedUser:', updatedUser);
        console.log('🔄 After refreshUser - user state:', user);
        
        // Use the returned updated user, not the state user
        const role = updatedUser?.role || user?.role || 'student';
        console.log('🎯 Final role to check:', role);
        
        if (role === 'admin') {
          console.log('✅ Redirecting to ADMIN dashboard');
          navigate('/admin-dashboard');
        } else if (role === 'staff') {
          console.log('✅ Redirecting to STAFF dashboard');
          navigate('/staff-dashboard');
        } else {
          console.log('✅ Redirecting to STUDENT dashboard');
          navigate('/student-dashboard');
        }
      }).catch((err) => {
        console.error('❌ Error refreshing user:', err);
        // Fallback redirect
        const role = user?.role || 'student';
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else if (role === 'staff') {
          navigate('/staff-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      });
    }
  }, [user, checked, navigate, refreshUser]);

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: 'calc(100vh - 64px)', py: 8 }}>
      <Container maxWidth="lg">
        {/* Hero */}
        <Grid container spacing={6} alignItems="center" sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Chip 
                label="College Event Photos Made Simple" 
                sx={{ alignSelf: 'flex-start', backgroundColor: '#1f1f1f', color: '#00a86b', fontWeight: 600 }} 
              />
              <Typography variant="h2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                Your Event Memories, Organized & Secure
              </Typography>
              <Typography variant="h6" sx={{ color: '#aaa', lineHeight: 1.6 }}>
                Click Aloysius provides a simple platform for managing college event photographs. 
                Approved students upload under staff supervision, all photos stay in one secure place, 
                and AI face recognition helps you find yourself instantly.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/gallery')}
                  sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' }, px: 4 }}
                >
                  Browse Gallery
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/my-photos')}
                  sx={{ borderColor: '#00a86b', color: '#00a86b', '&:hover': { borderColor: '#008f5b' }, px: 4 }}
                >
                  Find My Photos
                </Button>
              </Stack>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0f2d23 100%)', border: '1px solid #1f4033', p: 2 }}>
              <CardContent>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
                  Why Click Aloysius?
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { icon: <SecurityIcon />, title: 'Controlled Uploads', desc: 'Only approved students can upload under staff supervision' },
                    { icon: <PhotoLibraryIcon />, title: 'Centralized Gallery', desc: 'All approved photos in one organized place' },
                    { icon: <VerifiedUserIcon />, title: 'Privacy First', desc: 'Secure access within the college community only' },
                    { icon: <FaceIcon />, title: 'Face Recognition', desc: 'Find yourself quickly with AI-powered search' },
                  ].map((feature) => (
                    <Grid item xs={12} sm={6} key={feature.title}>
                      <Box sx={{ display: 'flex', gap: 1.5, p: 2, backgroundColor: '#161616', borderRadius: 2, border: '1px solid #1f4033' }}>
                        <Box sx={{ color: '#00a86b', mt: 0.5 }}>{feature.icon}</Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#aaa' }}>
                            {feature.desc}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* How it Works */}
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 4, textAlign: 'center' }}>
          How It Works
        </Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {[
            { step: '1', title: 'Students Upload', desc: 'Approved students submit event photos through the secure portal', color: '#00a86b' },
            { step: '2', title: 'Staff Approve', desc: 'Staff review and approve uploads to ensure quality and privacy', color: '#2196f3' },
            { step: '3', title: 'Browse & Search', desc: 'Everyone can view organized galleries and use face recognition to find photos', color: '#9c27b0' },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.step}>
              <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ py: 4 }}>
                  <Box sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    backgroundColor: item.color, 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 28, 
                    fontWeight: 700,
                    mx: 'auto',
                    mb: 2
                  }}>
                    {item.step}
                  </Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        <Card sx={{ background: 'linear-gradient(135deg, #0e1a1a 0%, #102a20 100%)', border: '1px solid #1f4033', textAlign: 'center', p: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
            Start Exploring Event Memories
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa', mb: 3, maxWidth: 600, mx: 'auto' }}>
            Browse through approved college event photos or use face recognition to find yourself across all events.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/gallery')}
              sx={{ backgroundColor: '#00a86b', '&:hover': { backgroundColor: '#008f5b' } }}
            >
              View Gallery
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ borderColor: '#00a86b', color: '#00a86b', '&:hover': { borderColor: '#008f5b' } }}
            >
              Login to Upload
            </Button>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
