// Met à jour le bouton de navigation "Connexion" pour afficher un avatar quand l'utilisateur est connecté.
// Nécessite que "supabase-client.js" soit déjà chargé.

function injectNavAuthStyles() {
  if (document.getElementById("nav-auth-styles")) return;

  const style = document.createElement("style");
  style.id = "nav-auth-styles";
  style.textContent = `
    .profile-btn {
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.12);
      background: rgba(164, 148, 196, 0.12);
      color: #1a1a1a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 38px;
      min-height: 38px;
    }

    .nav-avatar {
      display: inline-flex;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      align-items: center;
      justify-content: center;
      background: #a494c4;
      color: white;
      font-size: 1rem;
      font-weight: 700;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  document.head.appendChild(style);
}

async function updateNavAuthButton() {
  const btn = document.querySelector("#nav-auth-btn");
  if (!btn || !window.supabase) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const avatarLabel = session.user.email ? session.user.email[0].toUpperCase() : "U";

    btn.href = "profile.html";
    btn.classList.add("profile-btn");
    btn.innerHTML = `
      <span class="nav-avatar" aria-hidden="true">${avatarLabel}</span>
      <span class="sr-only">Mon profil</span>
    `;
  } else {
    btn.href = "auth.html";
    btn.classList.remove("profile-btn");
    btn.textContent = "Connexion";
  }
}

function initNavAuth() {
  injectNavAuthStyles();
  updateNavAuthButton();

  if (window.supabase) {
    supabase.auth.onAuthStateChange(() => {
      updateNavAuthButton();
    });
  }
}

document.addEventListener("DOMContentLoaded", initNavAuth);
