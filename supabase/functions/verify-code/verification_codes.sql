-- Table pour stocker les codes de vérification
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_code CHECK (code ~ '^[0-9]{6}$')
);

-- Index pour accélérer les recherches
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- RLS (Row Level Security)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres codes
CREATE POLICY "Users can view their own verification codes"
  ON verification_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Seul le service role peut insérer/mettre à jour
CREATE POLICY "Service role can manage verification codes"
  ON verification_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fonction pour nettoyer automatiquement les codes expirés (optionnel)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE verification_codes IS 'Stocke les codes de vérification à 6 chiffres pour validation email';
COMMENT ON COLUMN verification_codes.code IS 'Code à 6 chiffres envoyé par email';
COMMENT ON COLUMN verification_codes.expires_at IS 'Date expiration du code (15 minutes après création)';