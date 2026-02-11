/**
 * delete-user Edge Function
 * Deletes a user and all their data using Supabase Auth Admin API
 * Requires SERVICE_ROLE_KEY for admin operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check admin role
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Could not verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'teacher';
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { userId, email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user.id === userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const errors: string[] = [];

    console.log('[delete-user] Deleting user:', normalizedEmail, 'userId:', userId);

    // Delete app_account
    const { error: appAccError } = await adminClient
      .from('app_accounts')
      .delete()
      .eq('email', normalizedEmail);
    if (appAccError) {
      console.error('[delete-user] app_accounts delete error:', appAccError);
      errors.push(`app_accounts: ${appAccError.message}`);
    }

    // If we have a real user ID, delete associated data and auth user
    if (userId && !userId.startsWith('temp-')) {
      // Delete associated data tables
      const tables = [
        'skill_recordings',
        'fluency_recordings',
        'comprehension_recordings',
        'assessment_sessions',
        'consent_records',
        'archetype_feedback',
        'purchases',
      ];

      for (const table of tables) {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('user_id', userId);
        if (error) {
          console.error(`[delete-user] ${table} delete error:`, error);
          errors.push(`${table}: ${error.message}`);
        }
      }

      // Delete profile
      const { error: profileDelError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileDelError) {
        console.error('[delete-user] profiles delete error:', profileDelError);
        errors.push(`profiles: ${profileDelError.message}`);
      }

      // Delete auth user (this is the key part that requires admin API)
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('[delete-user] auth delete error:', authError);
        errors.push(`auth: ${authError.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn('[delete-user] Partial errors:', errors);
      return new Response(
        JSON.stringify({ success: true, warnings: errors, message: 'User deleted with some warnings' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user] Successfully deleted:', normalizedEmail);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[delete-user] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
