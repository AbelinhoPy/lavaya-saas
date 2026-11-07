-- 002_cash_sessions_and_stock.sql
-- LavaYA! Non-destructive Schema Migration for Stock, Cash Sessions, and Flexible Payment Timing
BEGIN;

-- 1. Relax payment timing constraint on wash_jobs to allow paying before or after delivery
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.wash_jobs'::regclass
          AND contype = 'c'
          AND conname LIKE '%payment%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.wash_jobs DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Drop generic check if it exists
ALTER TABLE public.wash_jobs DROP CONSTRAINT IF EXISTS wash_jobs_check;

-- Add updated flexible check constraint
ALTER TABLE public.wash_jobs 
    ADD CONSTRAINT wash_jobs_payment_method_check 
    CHECK (payment_method IS NULL OR payment_method IN ('efectivo', 'transferencia', 'pendiente'));

-- 2. CASH SESSIONS (Apertura y Cierre de caja con arqueo físico)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    opened_by TEXT NOT NULL,
    fondo_inicial BIGINT NOT NULL DEFAULT 0 CHECK (fondo_inicial >= 0),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    efectivo_esperado BIGINT,
    efectivo_contado BIGINT,
    diferencia BIGINT,
    notas TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_business ON public.cash_sessions(business_id, opened_at DESC);

-- 3. STOCK CATALOG & INVENTORY
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 100),
    categoria TEXT NOT NULL DEFAULT 'quimico',
    unidad TEXT NOT NULL CHECK (unidad IN ('L', 'ml', 'unidades', 'kg', 'g')),
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    costo_unitario BIGINT NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_business ON public.stock_items(business_id);

-- 4. STOCK MOVEMENTS (Auditoría de compras, consumos y mermas)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'consumo', 'ajuste')),
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    unidad TEXT NOT NULL,
    costo_total BIGINT NOT NULL DEFAULT 0,
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON public.stock_movements(item_id, created_at DESC);

-- 5. STOCK RECIPES (Estimación de consumo por servicio)
CREATE TABLE IF NOT EXISTS public.stock_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    cantidad_estimada NUMERIC(12, 2) NOT NULL CHECK (cantidad_estimada > 0),
    unidad TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (service_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_recipes_business ON public.stock_recipes(business_id);

COMMIT;
