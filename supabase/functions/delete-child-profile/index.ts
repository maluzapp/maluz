import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { profile_id } = await req.json().catch(() => ({}));
    if (!profile_id || typeof profile_id !== "string") {
      return json({ error: "profile_id required" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load target profile
    const { data: targetProfile, error: targetErr } = await adminClient
      .from("profiles")
      .select("id, user_id, profile_type, name")
      .eq("id", profile_id)
      .maybeSingle();

    if (targetErr || !targetProfile) {
      return json({ error: "Profile not found" }, 404);
    }

    // Authorization: caller must own the profile, OR be a linked parent of the (child) profile
    const isOwner = targetProfile.user_id === user.id;

    let isLinkedParent = false;
    if (!isOwner) {
      // Find caller's parent profile(s)
      const { data: myParentProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("profile_type", "parent");
      const parentIds = (myParentProfiles || []).map((p: any) => p.id);

      if (parentIds.length > 0) {
        const { data: links } = await adminClient
          .from("parent_child_links")
          .select("id")
          .eq("child_profile_id", profile_id)
          .in("parent_profile_id", parentIds)
          .limit(1);
        isLinkedParent = !!(links && links.length > 0);
      }
    }

    if (!isOwner && !isLinkedParent) {
      return json({ error: "Forbidden — not allowed to delete this profile" }, 403);
    }

    const childUserId = targetProfile.user_id;

    // Cascade delete dependent data tied to this profile
    await adminClient.from("study_sessions").delete().eq("profile_id", profile_id);
    await adminClient.from("daily_usage").delete().eq("profile_id", profile_id);
    await adminClient.from("invite_codes").delete().eq("profile_id", profile_id);
    await adminClient.from("reactions").delete().eq("profile_id", profile_id);

    await adminClient.from("challenges").delete()
      .or(`parent_profile_id.eq.${profile_id},child_profile_id.eq.${profile_id}`);
    await adminClient.from("friendships").delete()
      .or(`requester_profile_id.eq.${profile_id},target_profile_id.eq.${profile_id}`);
    await adminClient.from("parent_child_links").delete()
      .or(`parent_profile_id.eq.${profile_id},child_profile_id.eq.${profile_id}`);
    await adminClient.from("spouse_links").delete()
      .or(`profile_id.eq.${profile_id},spouse_profile_id.eq.${profile_id}`);

    // Delete the profile row
    const { error: profileDelError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", profile_id);

    if (profileDelError) {
      return json({ error: "Failed to delete profile: " + profileDelError.message }, 500);
    }

    // If deleting a linked CHILD account (caller is linked parent, child has its own auth user),
    // also remove the auth user + its remaining data so the account is fully wiped.
    if (isLinkedParent && childUserId && childUserId !== user.id) {
      // Check if the child user has any other profiles left; if not, delete the auth user fully.
      const { data: remainingProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", childUserId);

      if (!remainingProfiles || remainingProfiles.length === 0) {
        await adminClient.from("push_subscriptions").delete().eq("user_id", childUserId);
        await adminClient.from("notification_log").delete().eq("user_id", childUserId);
        await adminClient.from("user_subscriptions").delete().eq("user_id", childUserId);
        await adminClient.from("user_roles").delete().eq("user_id", childUserId);

        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(childUserId);
        if (authDelErr) {
          console.warn("[delete-child-profile] auth delete warn:", authDelErr.message);
        }
      }
    }

    return json({ success: true });
  } catch (err: any) {
    console.error("[delete-child-profile] error:", err);
    return json({ error: err?.message || String(err) }, 500);
  }
});
