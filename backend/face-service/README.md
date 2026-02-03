# Face Recognition Service

Flask microservice for face detection and embedding generation.

## Prerequisites (Windows)

**Important**: The `dlib` library (required by `face-recognition`) needs C++ compilation on Windows.

### Option 1: Install Visual Studio C++ Build Tools (Recommended)
1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. Install "Desktop development with C++" workload
3. Restart your terminal

### Option 2: Use Pre-compiled dlib Wheel
```powershell
# Download pre-built dlib wheel for your Python version from:
# https://github.com/z-mahmud22/Dlib_Windows_Python3.x

# Install it manually before requirements.txt:
pip install path/to/downloaded/dlib-wheel.whl
pip install -r requirements.txt
```

### Option 3: Use WSL (Windows Subsystem for Linux)
Install Ubuntu from Microsoft Store and run the service in Linux environment.

## Installation

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Service

```powershell
# Activate venv (if not already active)
venv\Scripts\activate

# Run Flask app
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "service": "face-recognition" }
```

### Generate Embedding
```
POST /embed
Body: { "imageUrl": "https://..." }
Response: { "embedding": [128 floats], "facesFound": 1 }
```

### Match Faces
```
POST /match
Body: { 
  "embedding1": [128 floats], 
  "embedding2": [128 floats],
  "threshold": 0.6
}
Response: { "match": true, "distance": 0.45, "threshold": 0.6 }
```

## Notes

- Face embeddings are 128-dimensional vectors
- Default match threshold is 0.6 (lower distance = more similar)
- Service handles image download and face detection automatically
- Returns error if no face or multiple faces found
