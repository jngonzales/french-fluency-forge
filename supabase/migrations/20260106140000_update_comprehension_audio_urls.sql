-- Update comprehension_items with static audio URLs
-- These files are stored in public/audio/comprehension/ and served as static assets

UPDATE public.comprehension_items
SET audio_url = '/audio/comprehension/' || id || '.mp3'
WHERE id IN (
  'lc_fr_a1_0001',
  'lc_fr_a1_0002',
  'lc_fr_a2_0003',
  'lc_fr_a2_0004',
  'lc_fr_a2_0005',
  'lc_fr_a2_0006',
  'lc_fr_a2_0009',
  'lc_fr_b1_0007',
  'lc_fr_b1_0008',
  'lc_fr_b1_0010',
  'lc_fr_b2_0011',
  'lc_fr_b2_0012'
);

