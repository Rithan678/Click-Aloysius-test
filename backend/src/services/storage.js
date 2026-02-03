import crypto from 'crypto';
import { getSupabaseAdmin } from '../config/supabaseClient.js';

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'event-photos';

export function buildStoragePath({ eventId, supabaseId, originalName = 'photo' }) {
  const safeName = originalName.replace(/\s+/g, '-');
  const stamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex');
  return `${eventId}/${supabaseId}/${stamp}-${random}-${safeName}`;
}

export async function createSignedUpload({ path, mimeType }) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path, 600, {
    contentType: mimeType,
  });

  if (error) {
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  return { ...data, bucket };
}

export function getPublicUrl(path) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
