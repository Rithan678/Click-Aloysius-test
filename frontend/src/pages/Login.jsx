import { Container, TextField, Button, Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LockIcon from '@mui/icons-material/Lock';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 40, color: '#00a86b', mr: 1 }} />
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                Login
              </Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ mt: 3, backgroundColor: '#00a86b' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Don't have an account?{' '}
                <Typography
                  component="span"
                  sx={{ color: '#00a86b', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
