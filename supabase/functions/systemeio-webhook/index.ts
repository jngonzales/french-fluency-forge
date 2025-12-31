import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify HMAC SHA256 signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return signature.toLowerCase() === computedSignature.toLowerCase();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const webhookSecret = Deno.env.get("SYSTEMEIO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("SYSTEMEIO_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("X-Webhook-Signature") || "";
    const messageId = req.headers.get("X-Webhook-Message-Id") || crypto.randomUUID();

    console.log(`[WEBHOOK] Received webhook with message_id: ${messageId}`);

    // Verify signature
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    // Store the event first (for idempotency check)
    const { data: existingEvent } = await supabase
      .from("systemeio_webhook_events")
      .select("id, processing_status")
      .eq("id", messageId)
      .single();

    if (existingEvent) {
      console.log(`[WEBHOOK] Duplicate webhook ${messageId}, returning 200`);
      return new Response(JSON.stringify({ status: "already_processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine event name from payload
    const eventName = payload.event_name || payload.event || "unknown";
    const eventTimestamp = payload.created_at || payload.timestamp || null;

    // Insert the webhook event
    const { error: insertError } = await supabase
      .from("systemeio_webhook_events")
      .insert({
        id: messageId,
        event_name: eventName,
        event_timestamp: eventTimestamp,
        payload,
        processing_status: isValid ? "received" : "failed",
        error: isValid ? null : "Invalid signature",
      });

    if (insertError) {
      console.error("[WEBHOOK] Failed to insert event:", insertError);
    }

    // If signature is invalid, return 401
    if (!isValid) {
      console.error("[WEBHOOK] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process successful sale events
    const isSaleEvent = 
      eventName.includes("sale") || 
      eventName.includes("payment") ||
      eventName.includes("purchase") ||
      eventName === "order.completed";

    const isCancelEvent = 
      eventName.includes("cancel") || 
      eventName.includes("refund");

    if (isCancelEvent) {
      // For cancellations/refunds, just mark as ignored (manual review needed)
      await supabase
        .from("systemeio_webhook_events")
        .update({
          processing_status: "ignored",
          processed_at: new Date().toISOString(),
          error: "Cancellation/refund - manual review required",
        })
        .eq("id", messageId);

      console.log(`[WEBHOOK] Cancel/refund event marked for manual review`);
      return new Response(JSON.stringify({ status: "ignored_for_review" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isSaleEvent) {
      // Extract buyer info from various possible payload structures
      const buyerEmail = (
        payload.buyer?.email ||
        payload.contact?.email ||
        payload.customer?.email ||
        payload.email ||
        ""
      ).toLowerCase().trim();

      const offerPricePlanId = 
        payload.offer_price_plan_id ||
        payload.product?.offer_price_plan_id ||
        payload.items?.[0]?.offer_price_plan_id ||
        payload.order?.offer_price_plan_id ||
        "";

      const orderId = 
        payload.order_id ||
        payload.id ||
        payload.order?.id ||
        "";

      if (!buyerEmail) {
        await supabase
          .from("systemeio_webhook_events")
          .update({
            processing_status: "failed",
            processed_at: new Date().toISOString(),
            error: "No buyer email found in payload",
          })
          .eq("id", messageId);

        console.error("[WEBHOOK] No buyer email in payload");
        return new Response(JSON.stringify({ error: "No buyer email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[WEBHOOK] Processing sale for ${buyerEmail}, offer: ${offerPricePlanId}`);

      // Look up product mapping
      let grantsAccess = false;
      let creditsDelta = 0;

      if (offerPricePlanId) {
        const { data: productMap } = await supabase
          .from("systemeio_product_map")
          .select("grants_access, credits_delta, active")
          .eq("offer_price_plan_id", offerPricePlanId)
          .single();

        if (productMap?.active) {
          grantsAccess = productMap.grants_access;
          creditsDelta = productMap.credits_delta;
          console.log(`[WEBHOOK] Product map found: grants_access=${grantsAccess}, credits=${creditsDelta}`);
        } else {
          console.log(`[WEBHOOK] No active product mapping for ${offerPricePlanId}`);
        }
      }

      // Upsert app_accounts
      const { data: existingAccount } = await supabase
        .from("app_accounts")
        .select("id, access_status")
        .eq("email", buyerEmail)
        .single();

      let accountId: string;

      if (existingAccount) {
        accountId = existingAccount.id;
        // Update access status if product grants access
        if (grantsAccess && existingAccount.access_status !== "active") {
          await supabase
            .from("app_accounts")
            .update({ access_status: "active" })
            .eq("id", accountId);
          console.log(`[WEBHOOK] Activated account ${accountId}`);
        }
      } else {
        // Create new account
        const { data: newAccount, error: createError } = await supabase
          .from("app_accounts")
          .insert({
            email: buyerEmail,
            access_status: grantsAccess ? "active" : "inactive",
          })
          .select("id")
          .single();

        if (createError || !newAccount) {
          console.error("[WEBHOOK] Failed to create account:", createError);
          throw new Error("Failed to create account");
        }
        accountId = newAccount.id;
        console.log(`[WEBHOOK] Created new account ${accountId}`);
      }

      // Ensure credit wallet exists
      const { data: existingWallet } = await supabase
        .from("credit_wallets")
        .select("id")
        .eq("account_id", accountId)
        .single();

      if (!existingWallet) {
        await supabase
          .from("credit_wallets")
          .insert({ account_id: accountId });
        console.log(`[WEBHOOK] Created credit wallet for ${accountId}`);
      }

      // Apply credits if any
      if (creditsDelta !== 0) {
        // Check if this message_id was already used for credits (idempotency)
        const { data: existingTx } = await supabase
          .from("credit_transactions")
          .select("id")
          .eq("systemeio_message_id", messageId)
          .single();

        if (!existingTx) {
          // Create transaction record
          const { error: txError } = await supabase
            .from("credit_transactions")
            .insert({
              account_id: accountId,
              delta: creditsDelta,
              reason: "purchase",
              systemeio_order_id: orderId,
              systemeio_offer_price_plan_id: offerPricePlanId,
              systemeio_message_id: messageId,
            });

          if (txError) {
            console.error("[WEBHOOK] Failed to create transaction:", txError);
          } else {
            // Get current wallet values and update
            const { data: wallet } = await supabase
              .from("credit_wallets")
              .select("test_credits_remaining, test_credits_lifetime")
              .eq("account_id", accountId)
              .single();

            if (wallet) {
              await supabase
                .from("credit_wallets")
                .update({
                  test_credits_remaining: wallet.test_credits_remaining + creditsDelta,
                  test_credits_lifetime: wallet.test_credits_lifetime + creditsDelta,
                })
                .eq("account_id", accountId);
            }

            console.log(`[WEBHOOK] Added ${creditsDelta} credits to ${accountId}`);
          }
        } else {
          console.log(`[WEBHOOK] Credits already applied for message ${messageId}`);
        }
      }

      // Mark event as processed
      await supabase
        .from("systemeio_webhook_events")
        .update({
          processing_status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      console.log(`[WEBHOOK] Successfully processed sale for ${buyerEmail}`);
      return new Response(JSON.stringify({ status: "processed", email: buyerEmail }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unknown event type - mark as ignored
    await supabase
      .from("systemeio_webhook_events")
      .update({
        processing_status: "ignored",
        processed_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    console.log(`[WEBHOOK] Unknown event type: ${eventName}`);
    return new Response(JSON.stringify({ status: "ignored" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WEBHOOK] Error processing webhook:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
