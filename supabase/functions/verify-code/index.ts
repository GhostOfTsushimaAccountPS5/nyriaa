// Supabase Edge Function: verify-code
// Vérifie le code de vérification et marque le compte comme vérifié

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, code } = await req.json();

    if (!user_id || !code) {
      return new Response(
        JSON.stringify({ ok: false, error: "user_id et code requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer le code de vérification
    const { data: verification, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (fetchError || !verification) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier si le code est expiré
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      // Supprimer le code expiré
      await supabase.from("verification_codes").delete().eq("user_id", user_id);

      return new Response(
        JSON.stringify({ ok: false, error: "Code expiré. Demande un nouveau code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier si le code correspond
    if (verification.code !== code) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code incorrect" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marquer le profil comme vérifié
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Erreur mise à jour profil:", updateError);
      return new Response(
        JSON.stringify({ ok: false, error: "Erreur lors de la vérification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supprimer le code utilisé
    await supabase.from("verification_codes").delete().eq("user_id", user_id);

    return new Response(
      JSON.stringify({ ok: true, message: "Compte vérifié avec succès" }),
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