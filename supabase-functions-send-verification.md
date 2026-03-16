# Supabase Edge Functions for email verification

Ce dossier contient des exemples d'Edge Functions Supabase pour :

- envoyer un code de vérification par email (SendGrid)
- valider ce code

Ces fonctions doivent être déployées dans Supabase (dans `supabase/functions/`).

---

## Table SQL requise

```sql
create table email_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists is_verified boolean not null default false;
```

---

## Configuration attendue

- `SUPABASE_URL` (fourni par Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (clé secrète, **ne jamais mettre dans le front**)
- `SENDGRID_API_KEY` (clé SendGrid)
- `SENDGRID_FROM_EMAIL` (expéditeur, ex. `no-reply@nyriaa.com`)

---

## Déploiement (exemple)

```bash
supabase functions deploy send-verification --no-verify-token
supabase functions deploy verify-code --no-verify-token
```

(Adapte selon ta configuration / version supabase CLI.)
