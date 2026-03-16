const $ = (selector) => document.querySelector(selector);

async function updateAuthUI() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Supabase session error", error);
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
    $("#user-email").textContent = session.user.email;
  }
}

async function handleSignUp(event) {
  event.preventDefault();
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;

  if (!email || !password) {
    alert("Veuillez renseigner un email et un mot de passe.");
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert(error.message);
    return;
  }

  alert("Email de confirmation envoyé. Vérifie ta boîte mail.");
  updateAuthUI();
}

async function handleSignIn(event) {
  event.preventDefault();
  const email = $("#signin-email").value.trim();
  const password = $("#signin-password").value;

  if (!email || !password) {
    alert("Veuillez renseigner un email et un mot de passe.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
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
    alert("Renseigne ton email pour recevoir le lien de réinitialisation.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/auth.html",
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Un email de réinitialisation a été envoyé.");
  }
}

window.addEventListener("load", async () => {
  document.querySelector("#signup-form").addEventListener("submit", handleSignUp);
  document.querySelector("#signin-form").addEventListener("submit", handleSignIn);
  document.querySelector("#signout-btn").addEventListener("click", handleSignOut);
  document.querySelector("#reset-form").addEventListener("submit", handleResetPassword);

  await updateAuthUI();

  // Met à jour l'UI si la session change (connexion/déconnexion dans un autre onglet)
  supabase.auth.onAuthStateChange(() => {
    updateAuthUI();
  });
});
