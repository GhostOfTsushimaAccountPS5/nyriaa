# 📧 Configuration Formspree pour Nyriaa

## ✅ Ce qui a été modifié :

1. ✅ **Index.html** - Images cachées sur mobile pour un affichage propre
2. ✅ **devenir-creatrice.html** - Formulaire configuré pour Formspree

---

## 🚀 Configuration Formspree (5 minutes)

### Étape 1 : Créer un compte Formspree

1. Va sur [formspree.io](https://formspree.io)
2. Clique sur "Get Started" (gratuit)
3. Inscris-toi avec ton email (ou GitHub)

### Étape 2 : Créer un nouveau formulaire

1. Une fois connecté, clique sur **"+ New Form"**
2. Nom du formulaire : **"Candidatures Nyriaa"**
3. Copie le **Form ID** qui ressemble à : `xyzabc123`

### Étape 3 : Modifier le fichier devenir-creatrice.html

Ouvre le fichier `devenir-creatrice.html` et cherche cette ligne (vers la ligne 420) :

```html
<form id="applicationForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST" enctype="multipart/form-data">
```

**Remplace `YOUR_FORM_ID`** par ton Form ID. Par exemple :

```html
<form id="applicationForm" action="https://formspree.io/f/xyzabc123" method="POST" enctype="multipart/form-data">
```

### Étape 4 : Configurer l'email de réception

1. Dans Formspree, va dans les paramètres de ton formulaire
2. Section **"Email Notifications"**
3. Entre ton email : **nyriaa.partners@outlook.com**
4. Active les notifications

### Étape 5 : Personnaliser (optionnel)

Dans Formspree, tu peux :
- ✅ Personnaliser l'email de confirmation
- ✅ Ajouter une page de redirection après soumission
- ✅ Configurer des auto-réponses
- ✅ Exporter les soumissions en CSV

---

## 📱 Améliorations Mobile

### Ce qui a été corrigé :

✅ **Images flottantes cachées sur mobile**
- Les 3 images ne s'affichent plus sur téléphone
- Hero section centrée et propre
- Texte et boutons parfaitement alignés
- Meilleure expérience utilisateur

✅ **Responsive amélioré**
- Tablette : images réduites mais visibles
- Mobile : design épuré sans images
- Tous les boutons en pleine largeur sur mobile

---

## 🎯 Limites du plan gratuit Formspree :

- **50 soumissions/mois** (largement suffisant pour commencer)
- Stockage des fichiers inclus
- Spam protection inclus
- Support email

### Si tu dépasses 50/mois :

**Plan payant** : 10$/mois pour 1000 soumissions
(mais franchement, si tu as 50 candidatures/mois, c'est que Nyriaa cartonne !) 🚀

---

## ✅ Test du formulaire

1. Upload ton site sur Vercel
2. Va sur la page "Devenir créatrice"
3. Remplis le formulaire de test
4. Vérifie que tu reçois l'email

---

## 🆘 Problèmes courants

**Problème** : "Form not found"
→ Vérifie que tu as bien remplacé `YOUR_FORM_ID`

**Problème** : Pas d'email reçu
→ Vérifie dans les spams
→ Vérifie l'email dans les settings Formspree

**Problème** : Photos trop lourdes
→ Formspree accepte max 10MB par fichier
→ Les utilisatrices doivent compresser si > 10MB

---

## 📝 Prochaines étapes

1. ✅ Remplace `YOUR_FORM_ID` dans devenir-creatrice.html
2. ✅ Upload sur Vercel
3. ✅ Teste le formulaire
4. ✅ Profite ! 🎉

---

**Questions ?** Tu sais où me trouver ! 💜