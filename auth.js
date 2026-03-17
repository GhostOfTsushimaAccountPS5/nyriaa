const $ = (selector) => document.querySelector(selector);

// Affiche un message utilisateur en haut de la page
function showAlert(message, type = "success") {
  const alert = $("#alert");
  if (!alert) return;

  alert.textContent = message;
  alert.className = "alert";
  alert.classList.add(type === "error" ? "alert--error" : "alert--success");
  alert.style.display = "block";

  setTimeout(() => {
    alert.style.display = "none";
  }, 5000);
}

// Affiche directement les erreurs JS afin de débugger en local
window.addEventListener("error", (event) => {
  showAlert(`Erreur JS : ${event.message}`, "error");
});

window.addEventListener("unhandledrejection", (event) => {
  showAlert(`Erreur JS : ${event.reason}`, "error");
});

async function updateAuthUI() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Supabase session error", error);
    return;
  }

  const loggedIn = Boolean(session?.user);

  document.querySelectorAll("[data-auth-when]").forEach((el) => {
    const when = el.getAttribute("data-auth-when");
    if (when === "logged-in") {
      el.style.display = loggedIn ? "" : "none";
    }
    if (when === "logged-out") {
      el.style.display = loggedIn ? "none" : "";
    }
  });

  if (loggedIn) {
    document.querySelector("#user-email").textContent = session.user.email;

    // Si l'utilisateur n'est pas encore vérifié, on affiche l'étape de vérification.
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("user_id", session.user.id)
      .single();

    if (profile && !profile.is_verified) {
      pendingVerification = {
        userId: session.user.id,
        email: session.user.email,
      };
      showVerificationPanel(session.user.email);
    }
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  // 8+ chars, au moins une lettre et un chiffre
  return /(?=.*[0-9])(?=.*[A-Za-z]).{8,}/.test(password);
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((button) => {
    const isActive = button.getAttribute("data-tab") === tab;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== tab);
  });

  // Hide reset form when switching
  if (tab === "signin") {
    $("#reset-form").classList.add("hidden");
    $("#signin-form").classList.remove("hidden");
  }
}

function showPopup() {
  $("#success-popup").classList.remove("hidden");
}

function hidePopup() {
  $("#success-popup").classList.add("hidden");
}

let pendingVerification = null;

async function createProfileIfNotExists(email, { force = false } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, is_verified")
    .eq("user_id", userId)
    .single();

  if (existing && !force) return;

  const insertPayload = {
    user_id: userId,
    email,
    username: email.split("@")[0],
    is_verified: false,
  };

  if (existing) {
    await supabase.from("profiles").update(insertPayload).eq("user_id", userId);
  } else {
    await supabase.from("profiles").insert(insertPayload);
  }
}

function showVerificationPanel(email) {
  const panel = $("#verification-panel");
  if (!panel) return;

  $("#verify-email").textContent = email;
  panel.classList.remove("hidden");
  $("#signup-form").classList.add("hidden");
  $("#signin-form").classList.add("hidden");
  $("#reset-form").classList.add("hidden");
}

function hideVerificationPanel() {
  const panel = $("#verification-panel");
  if (!panel) return;

  panel.classList.add("hidden");
  $("#signup-form").classList.remove("hidden");
  $("#signin-form").classList.remove("hidden");
}

async function sendVerificationCode(userId, email) {
  if (!userId || !email) {
    throw new Error("userId ou email manquant pour envoi du code de vérification.");
  }

  // Appelle une Supabase Edge Function pour envoyer un code par email.
  // Déploie une fonction sur Supabase nommée "send-verification".
  const { data, error } = await supabase.functions.invoke("send-verification", {
    body: JSON.stringify({ user_id: userId, email }),
  });

  if (error) {
    console.warn("Erreur en envoyant le code de vérification", error);
    throw new Error(error.message || "Impossible d'envoyer le code de vérification.");
  }

  if (!data?.ok) {
    throw new Error("La fonction send-verification a échoué (ok=false).");
  }

  return data;
}

async function verifyCode(userId, code) {
  const { data, error } = await supabase.functions.invoke("verify-code", {
    body: JSON.stringify({ user_id: userId, code }),
  });

  if (error) {
    throw error;
  }

  return data;
}

async function handleSignUp(event) {
  event.preventDefault();

  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;
  const passwordConfirm = $("#signup-password-confirm").value;

  if (!email || !password || !passwordConfirm) {
    showAlert("Veuillez remplir tous les champs.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showAlert("Adresse email invalide.", "error");
    return;
  }

  if (password !== passwordConfirm) {
    showAlert("Les mots de passe ne correspondent pas.", "error");
    return;
  }

  if (!validatePassword(password)) {
    showAlert("Le mot de passe doit contenir au moins 8 caractères, avec des lettres et des chiffres.", "error");
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    showAlert(error.message, "error");
    return;
  }

  let userId = data?.user?.id;

  if (!userId) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session lookup failed", sessionError);
    }
    userId = sessionData?.session?.user?.id;
  }

  if (!userId) {
    // GitHub Copilot cannot faire du backend ici, donc on explique.
    showAlert(
      "Impossible de créer ton compte maintenant (erreur utilisateur). Vérifie id + paramètres Supabase.",
      "error"
    );
    return;
  }

  // On garde les infos pour la suite de la vérification.
  pendingVerification = {
    userId,
    email,
    password,
  };

  // Crée automatiquement un profil dans la table `profiles`.
  await createProfileIfNotExists(email, { force: true });

  try {
    await sendVerificationCode(pendingVerification.userId, email);
    showVerificationPanel(email);
    showAlert("Un code de vérification a été envoyé. Vérifie ta boîte e-mail.", "success");
  } catch (err) {
    showAlert("Impossible d'envoyer le code de vérification. Essaie plus tard.", "error");
    console.error(err);
  }
}

async function handleSignIn(event) {
  event.preventDefault();

  const email = $("#signin-email").value.trim();
  const password = $("#signin-password").value;

  if (!email || !password) {
    showAlert("Veuillez renseigner un email et un mot de passe.", "error");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showAlert(error.message, "error");
    return;
  }

  // Après connexion, on vérifie si le compte est validé.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("user_id", session.user.id)
    .single();

  if (profile && !profile.is_verified) {
    pendingVerification = {
      userId: session.user.id,
      email,
      password,
    };
    await sendVerificationCode(session.user.id, email);
    showVerificationPanel(email);
    showAlert("Ton compte n'est pas encore vérifié. Entre le code reçu par email.", "error");
    return;
  }

  await updateAuthUI();
}

async function handleSignOut() {
  await supabase.auth.signOut();
  await updateAuthUI();
}

async function handleResetPassword(event) {
  event.preventDefault();
  const email = $("#reset-email").value.trim();
  if (!email) {
    showAlert("Renseigne ton email pour recevoir le lien de réinitialisation.", "error");
    return;
  }

  if (!validateEmail(email)) {
    showAlert("Adresse email invalide.", "error");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/auth.html",
  });

  if (error) {
    showAlert(error.message, "error");
  } else {
    showAlert("Un email de réinitialisation a été envoyé.", "success");
    $("#reset-form").classList.add("hidden");
    $("#signin-form").classList.remove("hidden");
  }
}

async function handleVerifyCode(event) {
  event.preventDefault();
  if (!pendingVerification) return;

  const code = $("#verification-code").value.trim();
  if (!code) {
    showAlert("Entre le code de vérification.", "error");
    return;
  }

  try {
    await verifyCode(pendingVerification.userId, code);
    showAlert("Ton compte est validé ! Redirection...", "success");

    // Reconnexion pour mettre à jour la session et l'état du bouton.
    await supabase.auth.signInWithPassword({
      email: pendingVerification.email,
      password: pendingVerification.password,
    });

    window.location.href = "index.html";
  } catch (err) {
    showAlert(err.message || "Code invalide.", "error");
  }
}

async function handleResendCode(event) {
  event.preventDefault();
  if (!pendingVerification) return;

  try {
    await sendVerificationCode(pendingVerification.userId, pendingVerification.email);
    showAlert("Un nouveau code a été envoyé.", "success");
  } catch (err) {
    showAlert("Impossible de renvoyer le code pour le moment.", "error");
  }
}

function handleCancelVerification(event) {
  event.preventDefault();
  pendingVerification = null;
  hideVerificationPanel();
}

window.addEventListener("load", async () => {
  if (window.location.protocol === "file:") {
    showAlert(
      "Pour que l'authentification fonctionne correctement, ouvre la page via un serveur local (ex: `python -m http.server`).",
      "error"
    );
    return;
  }

  document.querySelector("#signup-form").addEventListener("submit", handleSignUp);
  document.querySelector("#signin-form").addEventListener("submit", handleSignIn);
  document.querySelector("#signout-btn").addEventListener("click", handleSignOut);
  document.querySelector("#reset-form").addEventListener("submit", handleResetPassword);

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.getAttribute("data-tab")));
  });

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.previousElementSibling;
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.innerHTML = isPassword ? '<i class="fa fa-eye-slash"></i>' : '<i class="fa fa-eye"></i>';
    });
  });

  $("#forgot-link").addEventListener("click", (event) => {
    event.preventDefault();
    $("#signin-form").classList.add("hidden");
    $("#reset-form").classList.remove("hidden");
  });

  $("#back-to-signin").addEventListener("click", (event) => {
    event.preventDefault();
    $("#reset-form").classList.add("hidden");
    $("#signin-form").classList.remove("hidden");
  });

  $("#popup-close").addEventListener("click", hidePopup);
  $("#popup-ok").addEventListener("click", hidePopup);

  // Vérification par code
  if ($("#verify-btn")) {
    $("#verify-btn").addEventListener("click", handleVerifyCode);
  }
  if ($("#resend-code")) {
    $("#resend-code").addEventListener("click", handleResendCode);
  }
  if ($("#cancel-verification")) {
    $("#cancel-verification").addEventListener("click", handleCancelVerification);
  }

  await updateAuthUI();

  // Met à jour l'UI si la session change (connexion/déconnexion dans un autre onglet)
  supabase.auth.onAuthStateChange(() => {
    updateAuthUI();
  });
});
