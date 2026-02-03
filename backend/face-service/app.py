import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import requests
from io import BytesIO
from PIL import Image, ImageOps
import cv2

print("InsightFace will be loaded on first request...")

app = Flask(__name__)
CORS(app)

# Initialize InsightFace model lazily (so server starts fast)
face_app = None


def get_face_app():
    global face_app
    if face_app is None:
        print("Importing InsightFace (first request)...")
        from insightface.app import FaceAnalysis
        print("Initializing buffalo_l model (first request)...")
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        print("Preparing model (downloading if needed)...")
        face_app.prepare(ctx_id=0, det_size=(640, 640))
        print("Model ready!")
    return face_app



def load_image_from_bytes(image_bytes):
    """Load image from bytes and convert to BGR numpy array for InsightFace."""
    try:
        img = Image.open(BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Downsize if too large (to avoid memory issues)
        max_dim = 1500
        if img.width > max_dim or img.height > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            print(f"Image resized to: {img.size}")

        img_rgb = np.array(img)
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        print(f"Image loaded: {img.size}, shape: {img_bgr.shape}")
        return img_bgr
    except Exception as e:
        print(f"Image load error: {e}")
        return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'face-recognition'}), 200

@app.route('/warmup', methods=['POST'])
def warmup():
    """Pre-load the InsightFace model (call once after server starts)"""
    get_face_app()
    return jsonify({'status': 'model warmed'}), 200

@app.route('/embed', methods=['POST'])
def generate_embedding():
    """
    Generate face embedding(s) from an image using InsightFace
    Expected JSON: { "imageUrl": "https://..." } or { "imageBase64": "..." }
    Returns: { "embeddings": [[...], [...]], "facesFound": 2 }
    """
    try:
        data = request.get_json() or {}
        image_url = data.get('imageUrl')
        image_base64 = data.get('imageBase64')

        if not image_url and not image_base64:
            return jsonify({'error': 'imageUrl or imageBase64 is required'}), 400

        if image_base64:
            try:
                if image_base64.startswith('data:'):
                    image_base64 = image_base64.split(',', 1)[1]
                image_bytes = base64.b64decode(image_base64)
                image = load_image_from_bytes(image_bytes)
            except Exception as e:
                print(f"Base64 decode error: {e}")
                return jsonify({'error': 'Failed to decode base64 image'}), 400
        else:
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return jsonify({'error': 'Failed to download image'}), 400
            image = load_image_from_bytes(response.content)

        if image is None:
            return jsonify({'error': 'Failed to load image'}), 400

        print("Detecting faces with InsightFace...")
        try:
            faces = get_face_app().get(image)
            print(f"InsightFace detected: {len(faces)} faces")
            if len(faces) > 0:
                for i, face in enumerate(faces):
                    bbox_width = face.bbox[2] - face.bbox[0]
                    bbox_height = face.bbox[3] - face.bbox[1]
                    print(f"  Face {i+1}: width={bbox_width:.0f}px, height={bbox_height:.0f}px, bbox={face.bbox}")
        except Exception as e:
            print(f"InsightFace detection error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Face detection failed: {str(e)}'}), 500

        if len(faces) == 0:
            print("No faces found")
            return jsonify({'error': 'No faces found in image'}), 400

        # Filter out tiny faces (noise) - reduced threshold for selfies
        original_count = len(faces)
        faces = [f for f in faces if (f.bbox[2] - f.bbox[0]) >= 30]
        
        if len(faces) < original_count:
            print(f"Filtered out {original_count - len(faces)} tiny faces (< 30px)")
        
        if len(faces) == 0:
            print("No valid faces found after filtering tiny faces")
            return jsonify({'error': 'No faces found in image'}), 400

        # Sort faces by area (largest face = main person)
        faces = sorted(
            faces,
            key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]),
            reverse=True
        )

        embeddings = [
            {
                "embedding": face.embedding.tolist(),
                "bbox": face.bbox.tolist()
            }
            for face in faces
        ]
        print(f"Success: Generated {len(embeddings)} embeddings (dim={len(faces[0].embedding)})")

        return jsonify({
            'embeddings': embeddings,
            'facesFound': len(embeddings)
        }), 200

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def l2_normalize(x):
    return x / np.linalg.norm(x)

@app.route('/match', methods=['POST'])
def match_faces():
    # NOTE:
    # This /match endpoint is intentionally defensive and self-contained.
    # It normalizes embeddings internally to handle malformed or scaled inputs.
    #
    # Production face-matching logic (distance metric, thresholds, interpretation)
    # lives in the Node.js backend. This endpoint is used only for debugging,
    # backfill scripts, and validation—not the main search path.
    """
    Compare two face embeddings using cosine similarity
    Expected JSON: { "embedding1": [...], "embedding2": [...], "threshold": 0.4 }
    Returns: { "match": true/false, "distance": 0.3, "similarity": 0.7 }
    """
    try:
        data = request.get_json()
        embedding1 = data.get('embedding1')
        embedding2 = data.get('embedding2')
        threshold = data.get('threshold', 0.4)

        if not embedding1 or not embedding2:
            return jsonify({'error': 'Both embeddings are required'}), 400

        emb1 = l2_normalize(np.array(embedding1))
        emb2 = l2_normalize(np.array(embedding2))

        similarity = np.dot(emb1, emb2)
        distance = 1 - similarity
        is_match = distance <= threshold

        return jsonify({
            'match': bool(is_match),
            'distance': float(distance),
            'similarity': float(similarity),
            'threshold': threshold
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/find-matches', methods=['POST'])
def find_matches():
    """
    Find all images where the selfie embedding matches any face
    Expected JSON: { 
        "selfieEmbedding": [...], 
        "imageUrls": ["url1", "url2", ...],
        "threshold": 0.4 
    }
    Returns: { "matches": [{"url": "...", "similarity": 0.85, "bbox": [...]}] }
    """
    try:
        data = request.get_json()
        selfie_embedding = data.get('selfieEmbedding')
        image_urls = data.get('imageUrls', [])
        threshold = data.get('threshold', 0.4)

        if not selfie_embedding:
            return jsonify({'error': 'selfieEmbedding is required'}), 400
        
        if not image_urls:
            return jsonify({'error': 'imageUrls is required'}), 400

        selfie_emb = l2_normalize(np.array(selfie_embedding))
        matches = []

        print(f"Processing {len(image_urls)} images with threshold {threshold}...")

        for idx, url in enumerate(image_urls):
            try:
                # Download image
                response = requests.get(url, timeout=10)
                if response.status_code != 200:
                    print(f"[{idx+1}/{len(image_urls)}] Failed to download: {url}")
                    continue

                image = load_image_from_bytes(response.content)
                if image is None:
                    print(f"[{idx+1}/{len(image_urls)}] Failed to load image: {url}")
                    continue

                # Detect faces
                faces = get_face_app().get(image)
                
                # Filter tiny faces (30px = captures group/distant photos)
                original_face_count = len(faces)
                faces = [f for f in faces if (f.bbox[2] - f.bbox[0]) >= 30]
                
                if len(faces) < original_face_count:
                    print(f"  Filtered {original_face_count - len(faces)} tiny faces")
                
                if len(faces) == 0:
                    continue

                # Check each face for match
                for face in faces:
                    face_emb = l2_normalize(face.embedding)
                    similarity = np.dot(selfie_emb, face_emb)
                    distance = 1 - similarity

                    if distance <= threshold:
                        matches.append({
                            'url': url,
                            'similarity': float(similarity),
                            'distance': float(distance),
                            'bbox': face.bbox.tolist()
                        })
                        print(f"[{idx+1}/{len(image_urls)}] ✅ Match found! similarity={similarity:.3f}")
                        break  # Only need one match per image

            except Exception as e:
                print(f"[{idx+1}/{len(image_urls)}] Error processing {url}: {e}")
                continue

        print(f"Found {len(matches)} matches out of {len(image_urls)} images")
        
        return jsonify({
            'matches': matches,
            'totalImages': len(image_urls),
            'matchCount': len(matches)
        }), 200

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Face Recognition Service on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
