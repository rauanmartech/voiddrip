-- ============================================
-- SCHEMA DO SISTEMA DE CUPONS - VOID DRIP
-- ============================================
-- Execute este SQL no seu banco Supabase (PostgreSQL)
-- ============================================

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = true;

-- Tabela de resgate de cupons (controle de uso único)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL, -- user_id (se logado) ou email (se guest)
  order_id UUID,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garante que cada usuário só pode usar cada cupom uma vez
  UNIQUE(coupon_id, user_identifier)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_identifier ON coupon_redemptions(user_identifier);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order_id ON coupon_redemptions(order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - SUPABASE
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela coupons
-- Qualquer pessoa autenticada pode ler cupons ativos
CREATE POLICY "Cupons ativos são públicos"
  ON coupons FOR SELECT
  USING (active = true);

-- Apenas o admin pode inserir cupons
CREATE POLICY "Apenas admin pode criar cupons"
  ON coupons FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com'
  );

-- Apenas o admin pode atualizar cupons
CREATE POLICY "Apenas admin pode atualizar cupons"
  ON coupons FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com'
  );

-- Apenas o admin pode deletar cupons
CREATE POLICY "Apenas admin pode deletar cupons"
  ON coupons FOR DELETE
  USING (
    auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com'
  );

-- Políticas para a tabela coupon_redemptions
-- Qualquer pessoa autenticada pode ler resgates (para verificar se já usou)
CREATE POLICY "Usuários podem ler resgates próprios"
  ON coupon_redemptions FOR SELECT
  USING (
    user_identifier = auth.uid()::TEXT OR 
    user_identifier = auth.jwt() ->> 'email'
  );

-- Apenas o admin pode ler todos os resgates
CREATE POLICY "Admin pode ler todos os resgates"
  ON coupon_redemptions FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com'
  );

-- Qualquer pessoa autenticada pode criar resgate (no checkout)
CREATE POLICY "Usuários podem criar resgates"
  ON coupon_redemptions FOR INSERT
  WITH CHECK (
    user_identifier = auth.uid()::TEXT OR 
    user_identifier = auth.jwt() ->> 'email'
  );

-- Ninguém pode atualizar resgates (imutável após criação)
CREATE POLICY "Ninguém pode atualizar resgates"
  ON coupon_redemptions FOR UPDATE
  USING (false);

-- Apenas o admin pode deletar resgates
CREATE POLICY "Apenas admin pode deletar resgates"
  ON coupon_redemptions FOR DELETE
  USING (
    auth.jwt() ->> 'email' = 'rauanrocha.martech@gmail.com'
  );

-- ============================================
-- ATUALIZAÇÃO DA TABELA ORDERS (OPCIONAL)
-- ============================================
-- Se você quiser armazenar informações do cupom no pedido,
-- adicione estas colunas à tabela orders:

-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);

-- ============================================
-- CUPONS DE EXEMPLO (OPCIONAL)
-- ============================================
-- Descomente para criar cupons de teste:

-- INSERT INTO coupons (code, discount_type, discount_value, active, expires_at, created_by) VALUES
--   ('VOID20', 'percentage', 20, true, NULL, 'rauanrocha.martech@gmail.com'),
--   ('WELCOME50', 'fixed', 50, true, NOW() + INTERVAL '30 days', 'rauanrocha.martech@gmail.com'),
--   ('VIP10', 'percentage', 10, true, NULL, 'rauanrocha.martech@gmail.com');
