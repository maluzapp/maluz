import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { action } = await req.json();

    if (action === 'check') {
      // Get user's active subscription
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      return new Response(JSON.stringify({
        subscription: sub,
        plan: sub?.plan ?? { slug: 'free', daily_session_limit: 3, max_profiles: 1 },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'validate_store_receipt') {
      // Placeholder for store receipt validation
      // When integrating with Play Store / App Store, this endpoint will:
      // 1. Receive the purchase token / receipt
      // 2. Validate with Google Play / Apple APIs
      // 3. Create/update user_subscriptions record
      const { store_provider, purchase_token, product_id } = await req.json();
      
      // TODO: Implement actual store validation
      // For now, return a placeholder response
      return new Response(JSON.stringify({
        valid: false,
        message: 'Store validation not yet implemented. Integration pending.',
        store_provider,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
