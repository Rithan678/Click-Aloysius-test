import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FaceRecognition from './pages/FaceRecognition';
import MyPhotos from './pages/MyPhotos';
import Upload from './pages/Upload';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import TestImages from './pages/TestImages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/face-recognition" element={<FaceRecognition />} />
          <Route path="/my-photos" element={<MyPhotos />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/events" element={<Events />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/test-images" element={<TestImages />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
