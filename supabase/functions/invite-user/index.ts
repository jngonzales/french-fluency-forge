/**
 * invite-user Edge Function
 * Invites a new user via email using Supabase Auth Admin API
 * Requires SERVICE_ROLE_KEY for admin operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth - caller must be authenticated
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
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('[invite-user] Auth failed:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: `Authentication failed: ${userError?.message || 'Invalid or expired session'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[invite-user] Authenticated user:', user.email);

    // Create admin client with service role key (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user has admin/teacher role
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[invite-user] Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: `Error checking admin status: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[invite-user] Profile role:', profile?.role);
    const isAdmin = profile?.role === 'admin' || profile?.role === 'teacher';

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: `Admin access required. Your role: ${profile?.role || 'none'}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure app_account exists with active status
    const { error: accountError } = await adminClient
      .from('app_accounts')
      .upsert(
        { email: normalizedEmail, access_status: 'active' },
        { onConflict: 'email' }
      );

    if (accountError) {
      console.error('[invite-user] Error creating app_account:', accountError);
      // Non-fatal — continue with invite
    }

    // Invite the user via Auth Admin API
    const { data, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${req.headers.get('origin') || supabaseUrl}/reset-password`,
    });

    if (inviteError) {
      console.error('[invite-user] Invite error:', inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[invite-user] Successfully invited:', normalizedEmail);

    return new Response(
      JSON.stringify({ success: true, user: data.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[invite-user] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
