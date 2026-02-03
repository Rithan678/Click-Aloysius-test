import express from 'express';
import Event from '../models/Event.js';
import Photo from '../models/Photo.js';
import { requireAuth, requireRole, requireUploader } from '../middleware/auth.js';
import { buildStoragePath, createSignedUpload, getPublicUrl } from '../services/storage.js';
import { generateEmbeddingFromUrl, generateEmbeddingFromBase64, findMatches } from '../services/faceService.js';

const router = express.Router();

router.post('/prepare-upload', requireAuth, requireUploader(), async (req, res) => {
  try {
    const { eventId, mimeType = 'image/jpeg', description, originalName = 'upload.jpg' } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.uploadWindowEnd && new Date(event.uploadWindowEnd) < new Date()) {
      return res.status(403).json({ message: 'Upload window is closed for this event' });
    }

    if (event.allowedEmails?.length && !event.allowedEmails.includes((req.user.email || '').toLowerCase())) {
      return res.status(403).json({ message: 'You are not whitelisted for this event' });
    }

    const path = buildStoragePath({ eventId, supabaseId: req.authUser.id, originalName });
    const signed = await createSignedUpload({ path, mimeType });

    const photo = await Photo.create({
      eventId,
      uploaderSupabaseId: req.authUser.id,
      uploaderName: req.user.name,
      description,
      storagePath: signed.path,
      bucket: signed.bucket,
      status: 'pending',
    });

    res.json({
      photoId: photo._id,
      bucket: signed.bucket,
      path: signed.path,
      signedUrl: signed.signedUrl,
      token: signed.token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/pending', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  const pending = await Photo.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(100);
  res.json(pending);
});

router.post('/:id/approve', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    console.log(`📸 Approving photo: ${req.params.id}`);
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      console.log(`❌ Photo not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Photo not found' });
    }

    photo.status = 'approved';
    photo.approvedBy = req.authUser.id;
    photo.approvedAt = new Date();
    photo.publicUrl = getPublicUrl(photo.storagePath);
    console.log(`✅ Photo set to approved. Public URL: ${photo.publicUrl}`);

    // Optional: kick off embedding generation via face service
    if (!photo.faceEmbeddings?.length) {
      console.log(`🔄 Generating face embeddings...`);
      try {
        const embeddings = await generateEmbeddingFromUrl(photo.publicUrl);
        if (embeddings && Array.isArray(embeddings) && embeddings.length > 0) {
          photo.faceEmbeddings = embeddings.map(emb => ({
            vector: emb.embedding || emb,  // handle {embedding: [...], bbox: [...]} or raw array
            bbox: emb.bbox || null,
            source: 'face_service'
          }));
          console.log(`✅ Generated ${embeddings.length} embeddings`);
        } else {
          console.log(`⚠️  No embeddings returned (no faces or detection failed)`);
        }
      } catch (embError) {
        console.error(`⚠️  Embedding generation error (non-critical):`, embError.message);
      }
    } else {
      console.log(`⏭️  Embeddings already exist, skipping generation`);
    }

    await photo.save();
    console.log(`✅ Photo saved successfully`);
    res.json(photo);
  } catch (err) {
    console.error(`❌ Approve error:`, err);
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/reject', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { reason } = req.body;
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    photo.status = 'rejected';
    photo.rejectionReason = reason;
    await photo.save();

    res.json(photo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/event/:eventId', async (req, res) => {
  const photos = await Photo.find({ eventId: req.params.eventId, status: 'approved' }).sort({ createdAt: -1 });
  res.json(photos);
});

router.get('/all', requireAuth, async (req, res) => {
  const photos = await Photo.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(500);
  res.json(photos);
});

router.get('/my', requireAuth, async (req, res) => {
  const photos = await Photo.find({ uploaderSupabaseId: req.authUser.id }).sort({ createdAt: -1 }).limit(200);
  res.json(photos);
});

router.post('/face-search', requireAuth, async (req, res) => {
  try {
    const { embedding, threshold = 0.9 } = req.body;
    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ message: 'embedding array is required' });
    }

    console.log(`🔍 Face search: threshold=${threshold}`);
    
    const approvedPhotos = await Photo.find({ status: 'approved' }).limit(500);
    const photosWithEmbeddings = approvedPhotos.filter(p => p.faceEmbeddings && p.faceEmbeddings.length > 0);
    const photosWithoutEmbeddings = approvedPhotos.filter(p => !p.faceEmbeddings || p.faceEmbeddings.length === 0);
    
    console.log(`📊 Stats: Total approved=${approvedPhotos.length}, With embeddings=${photosWithEmbeddings.length}, Missing embeddings=${photosWithoutEmbeddings.length}`);
    
    const matches = findMatches(embedding, photosWithEmbeddings, threshold).map((match) => ({
      photoId: match.photo._id,
      storagePath: match.photo.storagePath,
      publicUrl: match.photo.publicUrl,
      distance: match.distance,
      confidence: match.confidence,
      eventId: match.photo.eventId,
    }));

    console.log(`✅ Found ${matches.length} matches`);
    if (photosWithoutEmbeddings.length > 0) {
      console.log(`⚠️  ${photosWithoutEmbeddings.length} approved photos are missing embeddings`);
    }

    res.json(matches);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/selfie-embed', requireAuth, async (req, res) => {
  try {
    const {
      imageBase64,
      detectionModel = 'cnn',
      upsample = 1,
      numJitters = 1,
    } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ message: 'imageBase64 is required' });
    }

    let embeddings = await generateEmbeddingFromBase64(imageBase64, {
      detectionModel,
      upsample,
      numJitters,
    });

    if (!embeddings || embeddings.length === 0) {
      embeddings = await generateEmbeddingFromBase64(imageBase64, {
        detectionModel: 'cnn',
        upsample: 2,
        numJitters: 1,
      });
    }

    if (!embeddings || embeddings.length === 0) {
      return res.status(400).json({ message: 'No faces found in selfie' });
    }

    // Extract embedding from new format {embedding: [...], bbox: [...]} or use raw array
    const firstEmb = embeddings[0];
    const embedding = Array.isArray(firstEmb) ? firstEmb : firstEmb.embedding;
    res.json({ embedding, facesFound: embeddings.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Backfill embeddings for approved photos
router.post('/backfill-embeddings', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    console.log('🔄 Starting backfill of missing embeddings...');
    const photosWithoutEmbeddings = await Photo.find({
      status: 'approved',
      $or: [
        { faceEmbeddings: { $exists: false } },
        { faceEmbeddings: { $size: 0 } }
      ]
    }).limit(100);

    console.log(`📸 Found ${photosWithoutEmbeddings.length} photos without embeddings`);

    let processed = 0;
    let failed = 0;
    let noFaces = 0;

    for (const photo of photosWithoutEmbeddings) {
      try {
        if (!photo.publicUrl) {
          photo.publicUrl = getPublicUrl(photo.storagePath);
        }

        console.log(`🔍 Processing photo: ${photo._id}`);
        const embeddings = await generateEmbeddingFromUrl(photo.publicUrl);
        
        if (embeddings && Array.isArray(embeddings) && embeddings.length > 0) {
          photo.faceEmbeddings = embeddings.map(emb => ({
            vector: emb.embedding || emb,
            bbox: emb.bbox || null,
            source: 'face_service_backfill'
          }));
          await photo.save();
          console.log(`✅ Saved ${embeddings.length} embeddings for photo ${photo._id}`);
          processed++;
        } else {
          console.log(`⚠️  No faces found in photo ${photo._id}`);
          noFaces++;
        }
      } catch (error) {
        console.error(`❌ Failed to process photo ${photo._id}:`, error.message);
        failed++;
      }
    }

    console.log(`✅ Backfill complete: processed=${processed}, noFaces=${noFaces}, failed=${failed}`);
    res.json({
      message: 'Backfill completed',
      total: photosWithoutEmbeddings.length,
      processed,
      noFaces,
      failed
    });
  } catch (err) {
    console.error('❌ Backfill error:', err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
