/**
 * Audio Storage Service
 * Handles uploading and retrieving audio files from Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'phrases-audio';

/**
 * Upload audio blob to Supabase Storage
 */
export async function uploadPhraseAudio(
  phraseId: string,
  audioBlob: Blob,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<string> {
  const fileName = `${phraseId}.${format}`;
  const filePath = fileName;

  // Upload file
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, audioBlob, {
      contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded audio');
  }

  return urlData.publicUrl;
}

/**
 * Check if audio file exists in storage
 */
export async function audioExists(phraseId: string, format: 'mp3' | 'wav' = 'mp3'): Promise<boolean> {
  const fileName = `${phraseId}.${format}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list('', {
      search: fileName,
    });

  if (error) {
    console.error('Error checking audio existence:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Get public URL for audio file (if it exists)
 */
export function getAudioPublicUrl(phraseId: string, format: 'mp3' | 'wav' = 'mp3'): string {
  const fileName = `${phraseId}.${format}`;
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);
  
  return data?.publicUrl || '';
}

/**
 * Delete audio file from storage
 */
export async function deletePhraseAudio(
  phraseId: string,
  format: 'mp3' | 'wav' = 'mp3'
): Promise<void> {
  const fileName = `${phraseId}.${format}`;
  
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileName]);

  if (error) {
    throw new Error(`Failed to delete audio: ${error.message}`);
  }
}

/**
 * Ensure storage bucket exists (call once during setup)
 */
export async function ensureStorageBucket(): Promise<void> {
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
  
  if (!bucketExists) {
    // Note: Creating buckets requires admin privileges
    // This should be done via Supabase dashboard or migration
    console.warn(`Storage bucket "${STORAGE_BUCKET}" does not exist. Please create it in Supabase dashboard.`);
  }
}

