/**
 * Playbook Seed Data
 * Loads the initial playbook JSON into the database
 */

import { supabase } from '@/integrations/supabase/client';
import type { PlaybookData } from './types';
import type { Json } from '@/integrations/supabase/types';
// @ts-ignore - JSON import
import playbookJson from './playbookSeedData.json';

/**
 * Seed the playbook into the database
 * Returns the created playbook ID
 */
export async function seedPlaybook(userId: string): Promise<string | null> {
  try {
    // Check if active playbook already exists
    const { data: existing } = await supabase
      .from('sales_playbook')
      .select('id')
      .eq('is_active', true)
      .single();

    if (existing) {
      console.log('Active playbook already exists, skipping seed');
      return existing.id;
    }

    // Deactivate any existing playbooks
    await supabase
      .from('sales_playbook')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    // Insert new playbook
    const { data, error } = await supabase
      .from('sales_playbook')
      .insert({
        version: (playbookJson as PlaybookData).meta.version,
        name: (playbookJson as PlaybookData).meta.name,
        playbook_data: playbookJson as unknown as Json,
        is_active: true,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log('Playbook seeded successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error seeding playbook:', error);
    return null;
  }
}

/**
 * Get the active playbook
 */
export async function getActivePlaybook(): Promise<PlaybookData | null> {
  try {
    const { data, error } = await supabase
      .from('sales_playbook')
      .select('playbook_data')
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data?.playbook_data as unknown as PlaybookData;
  } catch (error) {
    console.error('Error fetching active playbook:', error);
    return null;
  }
}

