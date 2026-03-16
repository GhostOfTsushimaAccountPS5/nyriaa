import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "no-reply@nyriaa.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY) {
  throw new Error("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashCode(code: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendMail(to: string, code: string) {
  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: "Ton code de vérification Nyriaa",
      },
    ],
    from: { email: SENDGRID_FROM_EMAIL, name: "Nyriaa" },
    content: [
      {
        type: "text/html",
        value: `
          <div style="font-family:system-ui, sans-serif; background:#faf8f3; padding:32px;">
            <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:18px; padding:28px; box-shadow:0 20px 60px rgba(0,0,0,0.08);">
              <h1 style="margin:0 0 16px; font-family:'Cormorant Garamond', serif; font-size:26px; color:#1a1a1a;">Bienvenue sur Nyriaa</h1>
              <p style="margin:0 0 22px; color:#4a4a4a; font-size:16px;">Voici ton code de vérification. Il expire dans 15 minutes.</p>
              <div style="display:inline-flex; font-size:2rem; letter-spacing:0.12em; background:#a494c4; color:#fff; padding:18px 22px; border-radius:14px;">
                ${code}
              </div>
              <p style="margin:22px 0 0; color:#7a7a7a; font-size:14px;">Si tu n'as pas demandé ce code, ignore simplement cet e-mail.</p>
            </div>
          </div>
        `,
      },
    ],
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SendGrid error: ${response.status} ${text}`);
  }
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
  const email = payload.email;

  if (!userId || !email) {
    return new Response(JSON.stringify({ error: "user_id and email are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const code = randomCode();
  const code_hash = await hashCode(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase
    .from("email_verifications")
    .insert({ user_id: userId, code_hash, expires_at: expiresAt });

  await sendMail(email, code);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
