import axios from 'axios';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5001';

export async function generateEmbeddingFromUrl(imageUrl, options = {}) {
  const request = async (payload) => axios.post(`${FACE_SERVICE_URL}/embed`, payload, { timeout: 30000 });

  try {
    const response = await request({ imageUrl, ...options });
    if (response.data?.embeddings) {
      // Handle new format: [{embedding: [...], bbox: [...]}, ...]
      return response.data.embeddings.map(item => 
        Array.isArray(item) ? item : item.embedding
      );
    }
  } catch (error) {
    console.error('Error generating embedding:', error.message);
  }

  try {
    const retry = await request({
      imageUrl,
      detectionModel: 'cnn',
      upsample: 2,
      numJitters: 1,
    });
    if (retry.data?.embeddings) {
      // Handle new format: [{embedding: [...], bbox: [...]}, ...]
      return retry.data.embeddings.map(item => 
        Array.isArray(item) ? item : item.embedding
      );
    }
  } catch (error) {
    console.error('Retry embedding failed:', error.message);
  }

  return [];
}

export async function generateEmbeddingFromBase64(imageBase64, options = {}) {
  try {
    const response = await axios.post(`${FACE_SERVICE_URL}/embed`, {
      imageBase64,
      ...options,
    }, { timeout: 30000 });

    if (response.data?.embeddings) {
      // Handle new format: [{embedding: [...], bbox: [...]}, ...]
      return response.data.embeddings.map(item => 
        Array.isArray(item) ? item : item.embedding
      );
    }
    return [];
  } catch (error) {
    console.error('Error generating embedding from base64:', error.message);
    return [];
  }
}

/**
 * Calculate cosine distance for InsightFace embeddings (512-dim)
 * Lower = more similar. Typical threshold: 0.3-0.5
 */
export function cosineDistance(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 2;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 2;

  const similarity = dotProduct / (normA * normB);
  return 1 - similarity;
}

/**
 * Legacy Euclidean distance (for 128-dim embeddings)
 */
export function euclideanDistance(a = [], b = []) {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function findMatches(queryEmbedding, photos, threshold = 0.4) {
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const isInsightFace = queryEmbedding.length === 512;
  const distanceFunc = isInsightFace ? cosineDistance : euclideanDistance;
  const defaultThreshold = isInsightFace ? 0.4 : 0.9;
  const actualThreshold = threshold ?? defaultThreshold;

  console.log(`🔍 Using ${isInsightFace ? 'cosine' : 'euclidean'} distance, dim=${queryEmbedding.length}, threshold=${actualThreshold}`);

  const results = [];
  const allDistances = [];
  let skippedDimensionMismatch = 0;

  photos.forEach((photo) => {
    (photo.faceEmbeddings || []).forEach((embeddingDoc) => {
      const photoVector = embeddingDoc.vector || [];
      
      // CRITICAL: Prevent 128D vs 512D silent failures
      if (photoVector.length !== queryEmbedding.length) {
        skippedDimensionMismatch++;
        return; // Skip this embedding
      }
      
      const distance = distanceFunc(queryEmbedding, photoVector);
      allDistances.push(distance);
      if (distance <= actualThreshold) {
        results.push({
          photo,
          distance,
          confidence: Math.max(0, (1 - distance) * 100),
        });
      }
    });
  });

  if (skippedDimensionMismatch > 0) {
    console.log(`⚠️  Skipped ${skippedDimensionMismatch} embeddings due to dimension mismatch (old 128D vs new 512D)`);
  }

  if (allDistances.length > 0) {
    const minDist = Math.min(...allDistances);
    const maxDist = Math.max(...allDistances);
    const avgDist = allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
    console.log(`📊 Distance stats: min=${minDist.toFixed(3)}, max=${maxDist.toFixed(3)}, avg=${avgDist.toFixed(3)}, threshold=${actualThreshold}`);
    console.log(`✅ Matches: ${results.length}/${allDistances.length} faces`);
    
    // Show distance distribution to help tune threshold
    const ranges = {
      'excellent (0.0-0.3)': allDistances.filter(d => d < 0.3).length,
      'good (0.3-0.5)': allDistances.filter(d => d >= 0.3 && d < 0.5).length,
      'fair (0.5-0.7)': allDistances.filter(d => d >= 0.5 && d < 0.7).length,
      'poor (0.7+)': allDistances.filter(d => d >= 0.7).length
    };
    console.log(`📈 Distribution:`, ranges);
  }

  return results.sort((a, b) => a.distance - b.distance);
}
