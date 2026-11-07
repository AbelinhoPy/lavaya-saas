-- 003_financial_and_concurrency_hardening.sql
-- LavaYA! Concurrency, Financial Columns, and Strict Business Isolation Hardening
BEGIN;

-- 1. Ensure at most ONE open cash session per business at the database level
-- First, detect and close any abnormal duplicate open sessions if any exist (keeping the latest)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY business_id ORDER BY opened_at DESC) as rn
            FROM public.cash_sessions
            WHERE status = 'open'
        ) sub
        WHERE sub.rn > 1
    ) LOOP
        UPDATE public.cash_sessions 
        SET status = 'closed', 
            closed_at = NOW(), 
            notas = COALESCE(notas, '') || ' [Cierre preventivo de sesion duplicada por migracion]'
        WHERE id = r.id;
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_cash_session 
    ON public.cash_sessions(business_id) 
    WHERE status = 'open';

-- 2. Add payment method and movement type to expenses table
-- Preserves existing records with NULL medio_pago to avoid assuming cash
ALTER TABLE public.expenses 
    ADD COLUMN IF NOT EXISTS medio_pago TEXT NULL 
    CHECK (medio_pago IS NULL OR medio_pago IN ('efectivo', 'transferencia', 'otro'));

ALTER TABLE public.expenses 
    ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'gasto' 
    CHECK (tipo IN ('gasto', 'retiro_dueno', 'entrada_dueno'));

CREATE INDEX IF NOT EXISTS idx_expenses_business_medio 
    ON public.expenses(business_id, medio_pago, fecha);

-- 3. Hardening stock movements with idempotency and vendor
ALTER TABLE public.stock_items 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.stock_items 
    ADD COLUMN IF NOT EXISTS proveedor TEXT NULL;

ALTER TABLE public.stock_movements 
    ADD COLUMN IF NOT EXISTS proveedor TEXT NULL;

ALTER TABLE public.stock_movements 
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_movements_idempotency 
    ON public.stock_movements(business_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- 4. Rollback procedure documentation
-- To rollback migration 003:
-- DROP INDEX IF EXISTS public.idx_unique_open_cash_session;
-- DROP INDEX IF EXISTS public.idx_expenses_business_medio;
-- DROP INDEX IF EXISTS public.idx_stock_movements_idempotency;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS medio_pago;
-- ALTER TABLE public.expenses DROP COLUMN IF EXISTS tipo;
-- ALTER TABLE public.stock_items DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE public.stock_items DROP COLUMN IF EXISTS proveedor;
-- ALTER TABLE public.stock_movements DROP COLUMN IF EXISTS proveedor;
-- ALTER TABLE public.stock_movements DROP COLUMN IF EXISTS idempotency_key;

COMMIT;
