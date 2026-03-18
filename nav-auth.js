// nav-auth.js
// Gère l'affichage du bouton de connexion/profil dans la navigation

(async function initNavAuth() {
  // Attend que Supabase soit chargé
  if (typeof supabase === 'undefined') {
    console.warn('Supabase non chargé, nav-auth.js ignoré');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const loggedIn = Boolean(session?.user);

    // Éléments à afficher/cacher selon l'état de connexion
    document.querySelectorAll('[data-auth-state]').forEach((el) => {
      const requiredState = el.getAttribute('data-auth-state');
      
      if (requiredState === 'logged-in') {
        el.style.display = loggedIn ? '' : 'none';
      } else if (requiredState === 'logged-out') {
        el.style.display = loggedIn ? 'none' : '';
      }
    });

    // Mise à jour du texte utilisateur si présent
    const userEmailEl = document.querySelector('[data-user-email]');
    if (userEmailEl && loggedIn) {
      userEmailEl.textContent = session.user.email || 'Utilisateur';
    }

    // Écouter les changements de session
    supabase.auth.onAuthStateChange((event, session) => {
      // Recharger la page lors de connexion/déconnexion
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        window.location.reload();
      }
    });
  } catch (error) {
    console.error('Erreur nav-auth:', error);
  }
})();