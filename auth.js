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

async function createProfileIfNotExists(email) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) return;

  await supabase.from("profiles").insert({
    user_id: userId,
    email,
    username: email.split("@")[0],
  });
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

  console.log("Sign up requested", { email, password });
  const { data, error } = await supabase.auth.signUp({ email, password });
  console.log("Supabase signUp result", { data, error });

  if (error) {
    showAlert(error.message, "error");
    return;
  }

  // Crée automatiquement un profil dans la table `profiles`.
  await createProfileIfNotExists(email);

  showPopup();
  updateAuthUI();
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

  await updateAuthUI();

  // Met à jour l'UI si la session change (connexion/déconnexion dans un autre onglet)
  supabase.auth.onAuthStateChange(() => {
    updateAuthUI();
  });
});
