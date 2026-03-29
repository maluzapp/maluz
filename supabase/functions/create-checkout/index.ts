import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json();
    // Support both: direct price_id (legacy) OR plan_slug + billing_period (new)
    let priceId = body.price_id as string | undefined;
    const planSlug = body.plan_slug as string | undefined;
    const billingPeriod = (body.billing_period as string) || "monthly";

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // If no direct price_id, resolve from Stripe by plan_slug metadata
    if (!priceId && planSlug) {
      logStep("Resolving price from Stripe metadata", { planSlug, billingPeriod });
      
      // Find product by plan_slug metadata
      const products = await stripe.products.search({
        query: `metadata["plan_slug"]:"${planSlug}"`,
      });

      if (products.data.length === 0) {
        throw new Error(`No Stripe product found for plan: ${planSlug}`);
      }

      const product = products.data[0];
      const interval = billingPeriod === "yearly" ? "year" : "month";
      
      // Get active prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      const matchingPrice = prices.data.find(
        (p) => p.recurring?.interval === interval
      );

      if (!matchingPrice) {
        throw new Error(`No active ${billingPeriod} price found for plan: ${planSlug}`);
      }

      priceId = matchingPrice.id;
      logStep("Resolved price", { priceId, amount: matchingPrice.unit_amount });
    }

    if (!priceId) throw new Error("price_id or plan_slug is required");

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://maluz.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/pagamento-sucesso`,
      cancel_url: `${origin}/#planos`,
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
