import { Container, Box, Typography, Button, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { selfieStorage } from '../services/selfieStorage';
import { postWithAuth } from '../services/apiClient';

export default function FaceRecognition() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasSelfie, setHasSelfie] = useState(selfieStorage.hasEmbedding());
  const fileInputRef = useRef();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage(null);
    }
  };

  const handleUploadSelfie = async () => {
    if (!selectedImage || !preview) {
      setMessage({ type: 'error', text: 'Please select an image first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await postWithAuth('/photos/selfie-embed', {
        imageBase64: preview,
        detectionModel: 'cnn',
        upsample: 1,
        numJitters: 1,
      });

      if (!data?.embedding) {
        setMessage({ type: 'error', text: 'No face detected in the image. Please upload a clear photo of your face.' });
        return;
      }

      const embedding = data.embedding;
      selfieStorage.setEmbedding(embedding);
      setHasSelfie(true);
      
      setMessage({ 
        type: 'success', 
        text: 'Selfie uploaded successfully! You can now find yourself in event photos.' 
      });
      
      // Clear after success
      setTimeout(() => {
        setSelectedImage(null);
        setPreview(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing selfie:', error);
      const apiMessage = error?.response?.data?.message;
      setMessage({
        type: 'error',
        text: apiMessage || 'Failed to process selfie. Please try a clearer image.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSelfie = () => {
    selfieStorage.clear();
    setHasSelfie(false);
    setSelectedImage(null);
    setPreview(null);
    setMessage({ type: 'info', text: 'Selfie removed. Upload a new one to enable face recognition.' });
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
            <FaceIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 40, color: '#00a86b' }} />
            Face Recognition Setup
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            Upload a clear selfie to automatically find yourself in event photos
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        {hasSelfie && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, backgroundColor: '#1a3a2a', color: '#fff', border: '1px solid #00a86b' }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleRemoveSelfie}
              >
                Remove
              </Button>
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon />
              <Typography fontWeight={600}>Face profile is active</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your selfie is saved. The system will automatically find you in event photos.
            </Typography>
          </Alert>
        )}

        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              {hasSelfie ? 'Update Your Selfie' : 'Upload Your Selfie'}
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              {preview ? (
                <Box sx={{ mb: 3 }}>
                  <img 
                    src={preview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                      borderRadius: '8px',
                      border: '2px solid #333'
                    }} 
                  />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    py: 8, 
                    mb: 3, 
                    border: '2px dashed #333', 
                    borderRadius: 2,
                    backgroundColor: '#0a0a0a'
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 80, color: '#333', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    No image selected
                  </Typography>
                </Box>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  sx={{ 
                    borderColor: '#00a86b', 
                    color: '#00a86b',
                    '&:hover': { borderColor: '#00a86b', backgroundColor: 'rgba(0, 168, 107, 0.1)' }
                  }}
                >
                  Choose Image
                </Button>

                {selectedImage && (
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    onClick={handleUploadSelfie}
                    disabled={loading}
                    sx={{ 
                      backgroundColor: '#00a86b',
                      '&:hover': { backgroundColor: '#008f5b' }
                    }}
                  >
                    {loading ? 'Processing...' : 'Upload Selfie'}
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ mt: 4, p: 2, backgroundColor: '#0a0a0a', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 2, fontWeight: 600 }}>
                Tips for best results:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                <li>Use a clear, well-lit photo of your face</li>
                <li>Face the camera directly</li>
                <li>Remove glasses or sunglasses if possible</li>
                <li>Ensure your entire face is visible</li>
                <li>Use a recent photo for better accuracy</li>
              </ul>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate('/my-photos')}
            sx={{ color: '#00a86b' }}
          >
            Go to My Photos →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
