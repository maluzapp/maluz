import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization") ?? "";
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id || typeof user_id !== "string") {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own admin account" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Cascade delete related data first
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user_id);
    const profileIds = (profiles || []).map((p: any) => p.id);

    if (profileIds.length > 0) {
      // Delete dependent data
      await adminClient.from("study_sessions").delete().in("profile_id", profileIds);
      await adminClient.from("daily_usage").delete().in("profile_id", profileIds);
      await adminClient.from("challenges").delete().or(`parent_profile_id.in.(${profileIds.join(",")}),child_profile_id.in.(${profileIds.join(",")})`);
      await adminClient.from("friendships").delete().or(`requester_profile_id.in.(${profileIds.join(",")}),target_profile_id.in.(${profileIds.join(",")})`);
      await adminClient.from("parent_child_links").delete().or(`parent_profile_id.in.(${profileIds.join(",")}),child_profile_id.in.(${profileIds.join(",")})`);
      await adminClient.from("spouse_links").delete().or(`profile_id.in.(${profileIds.join(",")}),spouse_profile_id.in.(${profileIds.join(",")})`);
      await adminClient.from("invite_codes").delete().in("profile_id", profileIds);
      await adminClient.from("reactions").delete().in("profile_id", profileIds);
    }

    // Delete user-scoped data
    await adminClient.from("push_subscriptions").delete().eq("user_id", user_id);
    await adminClient.from("notification_log").delete().eq("user_id", user_id);
    await adminClient.from("user_subscriptions").delete().eq("user_id", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Finally, delete the auth user
    const { error: delError } = await adminClient.auth.admin.deleteUser(user_id);
    if (delError) {
      return new Response(JSON.stringify({ error: "Auth deletion failed: " + delError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
