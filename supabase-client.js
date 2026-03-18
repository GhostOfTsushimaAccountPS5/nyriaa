// supabase-client.js
// Configuration du client Supabase

// ⚠️ REMPLACE CES VALEURS PAR TES VRAIES CLÉS SUPABASE
// Trouve-les dans : Supabase Dashboard → Settings → API

const SUPABASE_URL = "https://ckhjsxtdiqasmudztjkt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vxdb3rz6V9znl3dDvcniPA_UoKlsO65";

// Créer le client Supabase global
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log pour vérifier que c'est bien chargé
console.log('✅ Supabase client initialisé');