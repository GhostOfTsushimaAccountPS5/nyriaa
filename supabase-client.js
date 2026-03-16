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

// Attention : le CDN injecte un objet global `supabase`. Ici on l'appelle via `window.supabase`
// pour éviter le conflit avec la variable locale `supabase` qui est définie juste après.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globalement pour que les pages puissent l'utiliser sans module bundler.
window.supabase = supabase;
