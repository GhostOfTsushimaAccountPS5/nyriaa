// Supabase Edge Function: send-verification
// Envoie un code de vérification à 6 chiffres par email via SendGrid

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailViaSendGrid(to: string, code: string): Promise<boolean> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject: "Ton code de vérification Nyriaa",
        },
      ],
      from: {
        email: "nyriaa.team@outlook.com", // Remplace par ton email vérifié SendGrid
        name: "Nyriaa",
      },
      content: [
        {
          type: "text/html",
          value: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F3;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F3; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #A494C4, #C5B8D9); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; letter-spacing: 0.3em; color: #FFFFFF;">NYRIAA</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <h2 style="margin: 0 0 20px; font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: #1A1A1A;">Ton code de vérification</h2>
              
              <p style="margin: 0 0 35px; font-size: 16px; line-height: 1.6; color: #6A6A6A;">
                Bienvenue sur Nyriaa ! 💜<br>
                Entre ce code pour valider ton compte :
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, rgba(164, 148, 196, 0.1), rgba(197, 184, 217, 0.1)); border: 2px solid #A494C4; border-radius: 12px; padding: 25px; margin: 0 0 30px;">
                <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #A494C4; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="margin: 0 0 20px; font-size: 14px; color: #6A6A6A;">
                Ce code est valide pendant <strong>15 minutes</strong>.
              </p>
              
              <p style="margin: 0; font-size: 14px; color: #999;">
                Si tu n'as pas créé de compte, ignore cet email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F5F5; padding: 30px 40px; text-align: center; border-top: 1px solid #E8E8E8;">
              <p style="margin: 0 0 10px; font-size: 13px; color: #999;">
                Cet email a été envoyé par <strong>Nyriaa</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #BBB;">
                Pas besoin d'être connue pour être inspirante
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        },
      ],
    }),
  });

  return response.ok;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ ok: false, error: "user_id et email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY manquante");
      return new Response(
        JSON.stringify({ ok: false, error: "Configuration SendGrid manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Générer code à 6 chiffres
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarder dans Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabase
      .from("verification_codes")
      .upsert(
        {
          user_id,
          code,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("Erreur DB:", dbError);
      return new Response(
        JSON.stringify({ ok: false, error: "Erreur base de données" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Envoyer l'email
    const emailSent = await sendEmailViaSendGrid(email, code);

    if (!emailSent) {
      return new Response(
        JSON.stringify({ ok: false, error: "Erreur envoi email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Code envoyé avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur fonction:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});