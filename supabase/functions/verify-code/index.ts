import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hashCode(code: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();
  const userId = payload.user_id;
  const code = (payload.code || "").trim();

  if (!userId || !code) {
    return new Response(JSON.stringify({ error: "user_id and code are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const codeHash = await hashCode(code);

  const { data: verification, error } = await supabase
    .from("email_verifications")
    .select("id, used, expires_at")
    .eq("user_id", userId)
    .eq("code_hash", codeHash)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !verification) {
    return new Response(JSON.stringify({ error: "Code invalide ou expiré." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expiresAt = new Date(verification.expires_at);
  if (expiresAt.getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: "Code expiré." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("email_verifications")
    .update({ used: true })
    .eq("id", verification.id);

  await supabase
    .from("profiles")
    .update({ is_verified: true })
    .eq("user_id", userId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
