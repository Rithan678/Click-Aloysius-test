import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';

export default function Navbar() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 700, color: '#00a86b', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Click Aloysius
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa', display: { xs: 'none', sm: 'block' } }}>
              {user.name || user.email} • {user.role}
            </Typography>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {isStaff() && (
                <Button color="inherit" onClick={() => navigate('/staff-dashboard')} sx={{ color: '#00a86b' }}>
                  Staff
                </Button>
              )}
              {user.role === 'admin' && (
                <Button color="inherit" onClick={() => navigate('/admin-dashboard')} sx={{ color: '#00a86b' }}>
                  Admin
                </Button>
              )}
              {user.role === 'student' && (
                <Button color="inherit" onClick={() => navigate('/student-dashboard')} sx={{ color: '#00a86b' }}>
                  Student
                </Button>
              )}
              <Button color="inherit" onClick={handleLogout} sx={{ color: '#fff' }}>
                Logout
              </Button>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <Button onClick={handleMenuOpen} sx={{ color: '#fff' }}>
                <MenuIcon />
              </Button>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleMenuClose}>
                <MenuItem disabled>
                  <Typography variant="caption">{user.name || user.email} • {user.role}</Typography>
                </MenuItem>
                {isStaff() && (
                  <MenuItem onClick={() => { navigate('/staff-dashboard'); handleMenuClose(); }}>
                    Staff Dashboard
                  </MenuItem>
                )}
                {user.role === 'admin' && (
                  <MenuItem onClick={() => { navigate('/admin-dashboard'); handleMenuClose(); }}>
                    Admin Dashboard
                  </MenuItem>
                )}
                {user.role === 'student' && (
                  <MenuItem onClick={() => { navigate('/student-dashboard'); handleMenuClose(); }}>
                    Student Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
