import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Not authorized");

    const { plan_slug, name, price_monthly, price_yearly } = await req.json();
    if (!plan_slug) throw new Error("plan_slug is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find existing products by metadata
    const products = await stripe.products.search({
      query: `metadata["plan_slug"]:"${plan_slug}"`,
    });

    let product: Stripe.Product;
    if (products.data.length > 0) {
      // Update product name
      product = await stripe.products.update(products.data[0].id, { name });
    } else {
      // Try to find by name similarity, or create new
      product = await stripe.products.create({
        name,
        metadata: { plan_slug },
      });
    }

    // Now update prices: deactivate old prices and create new ones
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    const results: Record<string, string> = {};

    // Monthly price
    if (price_monthly > 0) {
      const amountMonthly = Math.round(price_monthly * 100);
      const existingMonthly = existingPrices.data.find(
        (p) => p.recurring?.interval === "month" && p.unit_amount === amountMonthly
      );

      if (existingMonthly) {
        results.monthly_price_id = existingMonthly.id;
      } else {
        // Deactivate old monthly prices
        for (const p of existingPrices.data.filter((p) => p.recurring?.interval === "month")) {
          await stripe.prices.update(p.id, { active: false });
        }
        const newPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: amountMonthly,
          currency: "brl",
          recurring: { interval: "month" },
          metadata: { plan_slug, period: "monthly" },
        });
        results.monthly_price_id = newPrice.id;
      }
    }

    // Yearly price
    if (price_yearly && price_yearly > 0) {
      const amountYearly = Math.round(price_yearly * 100);
      const existingYearly = existingPrices.data.find(
        (p) => p.recurring?.interval === "year" && p.unit_amount === amountYearly
      );

      if (existingYearly) {
        results.yearly_price_id = existingYearly.id;
      } else {
        for (const p of existingPrices.data.filter((p) => p.recurring?.interval === "year")) {
          await stripe.prices.update(p.id, { active: false });
        }
        const newPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: amountYearly,
          currency: "brl",
          recurring: { interval: "year" },
          metadata: { plan_slug, period: "yearly" },
        });
        results.yearly_price_id = newPrice.id;
      }
    }

    return new Response(JSON.stringify({ success: true, product_id: product.id, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
