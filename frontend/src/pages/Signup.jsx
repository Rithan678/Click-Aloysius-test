import { Container, TextField, Button, Box, Typography, Card, CardContent, Alert, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    registrationNo: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Registration number only required for students
    if (formData.role === 'student' && formData.registrationNo.length === 0) {
      setError('Registration number is required for students');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            registration_no: formData.registrationNo || null,
            role: formData.role,
          }
        }
      });

      if (signUpError) throw signUpError;

      const message = formData.role === 'staff' 
        ? 'Account created! Staff accounts need approval. Please log in and wait for admin approval.'
        : 'Account created successfully! Please log in.';

      navigate(`/login?message=${encodeURIComponent(message)}`);
    } catch (err) {
      setError(err.message || 'Signup failed');
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
              <PersonAddIcon sx={{ fontSize: 40, color: '#00a86b', mr: 1 }} />
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                Sign Up
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                }}
              />

              {/* Role Selection */}
              <Typography variant="subtitle2" sx={{ color: '#aaa', mt: 3, mb: 1 }}>
                Account Type
              </Typography>
              <RadioGroup
                name="role"
                value={formData.role}
                onChange={handleChange}
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="student"
                  control={<Radio sx={{ color: '#00a86b' }} />}
                  label={
                    <Box>
                      <Typography sx={{ color: '#fff', fontWeight: 500 }}>Student</Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        Upload and view photos from events
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="staff"
                  control={<Radio sx={{ color: '#00a86b' }} />}
                  label={
                    <Box>
                      <Typography sx={{ color: '#fff', fontWeight: 500 }}>Staff</Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        Create events and approve photos (requires approval)
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              {/* Registration Number - Only for Students */}
              {formData.role === 'student' ? (
                <TextField
                  fullWidth
                  label="Registration Number"
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                  }}
                />
              ) : (
                <Card sx={{ backgroundColor: '#1a3a2a', border: '1px solid #00a86b', mt: 2, mb: 2 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#00a86b', display: 'flex', alignItems: 'center', gap: 1 }}>
                      ✓ Staff accounts don't require registration numbers
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <TextField
                fullWidth
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' }
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Already have an account?{' '}
                <Typography
                  component="span"
                  sx={{ color: '#00a86b', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
