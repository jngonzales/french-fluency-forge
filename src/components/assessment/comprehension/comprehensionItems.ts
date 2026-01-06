import { supabase } from '@/integrations/supabase/client';

export interface ComprehensionItem {
  id: string;
  language: string;
  cefr_level: string;
  transcript_fr: string;
  word_count: number;
  estimated_duration_s: number;
  prompt_fr: string;
  prompt_en: string;
  options: Array<{ id: string; fr: string; en: string }>;
  answer_key: { correct_option_ids: string[] };
  audio_url: string | null;
  audio_storage_path: string | null;
}

// Helper to convert database item to interface with prompt object (for backward compatibility)
export interface ComprehensionItemWithPrompt extends Omit<ComprehensionItem, 'prompt_fr' | 'prompt_en'> {
  prompt: { fr: string; en: string };
}

/**
 * Fetch all comprehension items from database that have audio
 */
export async function getComprehensionItems(): Promise<ComprehensionItem[]> {
  const { data, error } = await supabase
    .from('comprehension_items' as any)
    .select('*')
    .not('audio_url', 'is', null)
    .order('cefr_level', { ascending: true })
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching comprehension items:', error);
    throw error;
  }
  
  return (data || []) as unknown as ComprehensionItem[];
}

/**
 * Get a subset of items for assessment (6 items - mix of levels)
 * Only returns items that have audio_url
 */
export async function getAssessmentItems(): Promise<ComprehensionItemWithPrompt[]> {
  const items = await getComprehensionItems();
  
  // Return a mix: 2 A1, 2 A2, 1 B1, 1 B2
  const a1Items = items.filter(item => item.cefr_level === "A1");
  const a2Items = items.filter(item => item.cefr_level === "A2");
  const b1Items = items.filter(item => item.cefr_level === "B1");
  const b2Items = items.filter(item => item.cefr_level === "B2");
  
  const selected = [
    a1Items[0], // lc_fr_a1_0001
    a1Items[1], // lc_fr_a1_0002
    a2Items[0], // lc_fr_a2_0003
    a2Items[1], // lc_fr_a2_0004
    b1Items[0], // lc_fr_b1_0007
    b2Items[0]  // lc_fr_b2_0011
  ].filter(Boolean); // Remove undefined entries if any level is missing
  
  // Convert to format with prompt object for backward compatibility
  return selected.map(item => ({
    ...item,
    prompt: {
      fr: item.prompt_fr,
      en: item.prompt_en,
    },
  }));
}

/**
 * Get item by ID from database
 */
export async function getItemById(id: string): Promise<ComprehensionItemWithPrompt | null> {
  const { data, error } = await supabase
    .from('comprehension_items' as any)
    .select('*')
    .eq('id', id)
    .not('audio_url', 'is', null)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const item = data as any as ComprehensionItem;
  
  return {
    ...item,
    prompt: {
      fr: item.prompt_fr,
      en: item.prompt_en,
    },
  };
}
