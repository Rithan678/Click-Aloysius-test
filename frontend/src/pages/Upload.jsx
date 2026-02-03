import { Container, Box, Typography, Button, Card, CardContent, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel, TextField, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getWithAuth, postWithAuth } from '../services/apiClient';
import { supabase } from '../lib/supabaseClient';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!user) return;
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    try {
      const { data } = await getWithAuth('/events');
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setMessage({ type: 'error', text: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Please select an event' });
      return;
    }

    if (selectedFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one photo' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      let successCount = 0;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));

        try {
          // Prepare upload
          console.log('Preparing upload for:', file.name);
          const { data: prepareData } = await postWithAuth('/photos/prepare-upload', {
            eventId: selectedEvent,
            mimeType: file.type,
            description: description || file.name,
            originalName: file.name,
          });
          
          console.log('Prepare response:', prepareData);

          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from(prepareData.bucket)
            .upload(prepareData.path, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            setMessage({ type: 'error', text: `Failed to upload ${file.name}: ${uploadError.message}` });
            continue;
          }

          console.log('Successfully uploaded:', file.name);
          successCount++;
        } catch (fileError) {
          console.error('Error uploading file:', file.name, fileError);
          setMessage({ type: 'error', text: `Error uploading ${file.name}: ${fileError.message}` });
        }
      }

      if (successCount > 0) {
        setMessage({ 
          type: 'success', 
          text: `Successfully uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}. Pending staff approval.` 
        });
        
        // Reset form
        setSelectedFiles([]);
        setDescription('');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage({ type: 'error', text: 'No photos were uploaded successfully. Please try again.' });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Failed to upload photos: ${error.response?.data?.message || error.message}` });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#00a86b' }} />
            Upload Photos
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Upload event photos for review and approval
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00a86b' }} />
          </Box>
        ) : (
          <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ p: 4 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#aaa' }}>Select Event</InputLabel>
                <Select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  label="Select Event"
                  disabled={uploading}
                  sx={{ 
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#333' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00a86b' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00a86b' },
                    '.MuiSvgIcon-root': { color: '#aaa' }
                  }}
                >
                  {events.map((event) => (
                    <MenuItem key={event._id} value={event._id}>
                      {event.name} - {event.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                multiline
                rows={2}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: '#333' },
                    '&:hover fieldset': { borderColor: '#00a86b' },
                    '&.Mui-focused fieldset': { borderColor: '#00a86b' }
                  },
                  '& .MuiInputLabel-root': { color: '#aaa' }
                }}
              />

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{ 
                    borderColor: '#00a86b', 
                    color: '#00a86b',
                    mb: 2,
                    '&:hover': { borderColor: '#00a86b', backgroundColor: 'rgba(0, 168, 107, 0.1)' }
                  }}
                >
                  Select Photos
                </Button>

                {selectedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedFiles.map((file, index) => (
                        <Typography key={index} variant="caption" sx={{ color: '#666', display: 'block' }}>
                          {file.name}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      backgroundColor: '#333',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#00a86b' }
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#aaa', mt: 1, textAlign: 'center' }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={handleUpload}
                disabled={uploading || !selectedEvent || selectedFiles.length === 0}
                sx={{ 
                  backgroundColor: '#00a86b',
                  py: 1.5,
                  '&:hover': { backgroundColor: '#008f5b' },
                  '&:disabled': { backgroundColor: '#333', color: '#666' }
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </Button>

              <Box sx={{ mt: 3, p: 2, backgroundColor: '#0a0a0a', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 1, fontWeight: 600 }}>
                  Upload Guidelines:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                  <li>Photos will be reviewed by staff before approval</li>
                  <li>Accepted formats: JPG, PNG, HEIC</li>
                  <li>Maximum file size: 10MB per photo</li>
                  <li>You can upload multiple photos at once</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
