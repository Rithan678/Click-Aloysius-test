import { Container, Typography, Box, Grid, Card, CardContent, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import EventIcon from '@mui/icons-material/Event';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getWithAuth, postWithAuth } from '../services/apiClient';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    pendingPhotos: 0,
    approvedPhotos: 0,
    rejectedPhotos: 0,
    totalEvents: 0,
    activeEvents: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getWithAuth('/dev/stats'),
      getWithAuth('/photos/pending'),
      getWithAuth('/events'),
      getWithAuth('/dev/pending-staff'),
      getWithAuth('/dev/all-users'),
    ])
      .then(([statsRes, pendingRes, eventsRes, pendingStaffRes, allUsersRes]) => {
        const statsData = statsRes.data || {};
        setStats({
          totalPhotos: statsData.totalPhotos || 0,
          pendingPhotos: pendingRes.data?.length || 0,
          approvedPhotos: statsData.approvedPhotos || 0,
          rejectedPhotos: statsData.rejectedPhotos || 0,
          totalEvents: eventsRes.data?.length || 0,
          activeEvents: eventsRes.data?.filter(e => e.status === 'active')?.length || 0
        });
        
        const activity = (pendingRes.data || []).slice(0, 5).map(photo => ({
          id: photo._id,
          type: 'photo_upload',
          user: photo.uploaderName || 'Unknown',
          timestamp: photo.createdAt,
          status: photo.status
        }));
        setRecentActivity(activity);
        setPendingStaff(pendingStaffRes.data || []);
        setAllUsers(allUsersRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      });
  }, [user]);

  const handleApproveStaff = async (userId) => {
    try {
      await postWithAuth(`/dev/approve-staff/${userId}`, {});
      setPendingStaff(pendingStaff.filter(s => s._id !== userId));
      setAllUsers(allUsers.map(u => u._id === userId ? { ...u, canUpload: true } : u));
    } catch (error) {
      console.error('Failed to approve staff:', error);
    }
  };

  const handleRejectStaff = async (userId) => {
    try {
      await postWithAuth(`/dev/reject-staff/${userId}`, {});
      setPendingStaff(pendingStaff.filter(s => s._id !== userId));
    } catch (error) {
      console.error('Failed to reject staff:', error);
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
            <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#ff6b6b' }} />
            Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            System Overview & Management
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
                    <PhotoLibraryIcon sx={{ fontSize: 40, color: '#00a86b', mb: 1 }} />
                    <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
                      {stats.totalPhotos}
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
                    <PendingActionsIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                    <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 700, mb: 1 }}>
                      {stats.pendingPhotos}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Pending Photos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#1a3a2a', border: '1px solid #00a86b' }}>
                  <CardContent>
                    <EventIcon sx={{ fontSize: 40, color: '#00a86b', mb: 1 }} />
                    <Typography variant="h3" sx={{ color: '#00a86b', fontWeight: 700, mb: 1 }}>
                      {stats.totalEvents}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Total Events
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ backgroundColor: '#3a2a1a', border: '1px solid #ff9800' }}>
                  <CardContent>
                    <PeopleIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                    <Typography variant="h3" sx={{ color: '#ff9800', fontWeight: 700, mb: 1 }}>
                      {pendingStaff.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Pending Staff Approval
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
                <Tab label="📊 Overview" />
                <Tab label="👥 Staff Management" />
                <Tab label="👤 All Users" />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            {tab === 0 && (
              <>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Recent Activity
                </Typography>
                <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333', mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>User</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Action</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Status</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentActivity.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ color: '#aaa', textAlign: 'center', borderBottom: 'none', py: 4 }}>
                            No recent activity
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentActivity.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                              {activity.user}
                            </TableCell>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                              Photo Upload
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #333' }}>
                              <Chip 
                                label={activity.status} 
                                size="small"
                                sx={{ 
                                  backgroundColor: activity.status === 'pending' ? '#ff9800' : '#00a86b',
                                  color: '#fff',
                                  textTransform: 'capitalize'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                              {new Date(activity.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Photo Stats */}
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Photo Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ backgroundColor: '#1a3a2a', border: '1px solid #00a86b' }}>
                      <CardContent>
                        <Typography variant="h4" sx={{ color: '#00a86b', fontWeight: 700 }}>
                          {stats.approvedPhotos}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          Approved Photos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ backgroundColor: '#3a2a1a', border: '1px solid #ff9800' }}>
                      <CardContent>
                        <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 700 }}>
                          {stats.pendingPhotos}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          Pending Review
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ backgroundColor: '#3a1a1a', border: '1px solid #ff6b6b' }}>
                      <CardContent>
                        <Typography variant="h4" sx={{ color: '#ff6b6b', fontWeight: 700 }}>
                          {stats.rejectedPhotos}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          Rejected Photos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Staff Management Tab */}
            {tab === 1 && (
              <>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  Pending Staff Approvals ({pendingStaff.length})
                </Typography>

                {pendingStaff.length === 0 ? (
                  <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon sx={{ fontSize: 60, color: '#00a86b', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        All caught up!
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        No pending staff approvals
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Name</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Email</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Registration No.</TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333', textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingStaff.map((staff) => (
                          <TableRow key={staff._id}>
                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                              {staff.name}
                            </TableCell>
                            <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                              {staff.email}
                            </TableCell>
                            <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                              {staff.regno || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #333', textAlign: 'center' }}>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleApproveStaff(staff._id)}
                                sx={{ backgroundColor: '#00a86b', mr: 1, '&:hover': { backgroundColor: '#008f5b' } }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={() => handleRejectStaff(staff._id)}
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

            {/* All Users Tab */}
            {tab === 2 && (
              <>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                  All Users ({allUsers.length})
                </Typography>

                <TableContainer component={Paper} sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Name</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Email</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Role</TableCell>
                        <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allUsers.map((u) => (
                        <TableRow key={u._id}>
                          <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                            {u.name}
                          </TableCell>
                          <TableCell sx={{ color: '#aaa', borderBottom: '1px solid #333' }}>
                            {u.email}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #333' }}>
                            <Chip
                              label={u.role}
                              size="small"
                              sx={{
                                backgroundColor: u.role === 'admin' ? '#ff6b6b' : u.role === 'staff' ? '#2196f3' : '#00a86b',
                                color: '#fff'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid #333' }}>
                            <Chip
                              label={u.canUpload ? 'Active' : 'Pending'}
                              size="small"
                              sx={{
                                backgroundColor: u.canUpload ? '#00a86b' : '#ff9800',
                                color: '#fff'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
