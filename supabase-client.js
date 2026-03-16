/**
 * Supabase client initialization.
 *
 * 1) Crée un projet sur https://app.supabase.com/
 * 2) Copie ton "Project URL" et ta clé publique (Anon key)
 * 3) Remplace les valeurs ci-dessous ou configure des variables d'environnement
 *    (recommandé pour Vercel/Netlify).
 *
 * Remarque : sur un site statique, la clé Anon est visible par tous.
 * Assure-toi d'activer "Row Level Security" (RLS) et de configurer des policy
 * pour sécuriser ta base de données.
 */

const SUPABASE_URL = "https://ckhjsxtdiqasmudztjkt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vxdb3rz6V9znl3dDvcniPA_UoKlsO65";

// Le CDN injecte un objet global `supabase`. On s'en sert pour créer le client.
// On évite de déclarer `const supabase` global afin de ne pas entrer en TDZ dans d'autres scripts.
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error(
    "Supabase.js n'est pas chargé. Assure-toi que le script CDN est bien inclus avant ce fichier."
  );
} else {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Remplace le global pour que `supabase` dans les autres scripts référence le client.
  window.supabase = client;
}
