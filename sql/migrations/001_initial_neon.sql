-- 001_initial_neon.sql
-- LavaYA! Production Schema for Neon PostgreSQL
-- Migrated from Supabase: eliminates auth.users/auth.uid/Supabase RLS dependencies.
-- Fully compatible with Neon connection pooling and Vercel serverless functions.

BEGIN;

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. AUTHENTICATION & IDENTITY (Better Auth / Neon Schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMPTZ,
    refresh_token_expires_at TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);

-- ============================================================================
-- 2. BUSINESSES & MEMBERSHIP
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);

CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_business_user ON public.business_members(business_id, user_id);

-- ============================================================================
-- 3. SERVICES & EXTRAS CATALOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    tipo_vehiculo TEXT NOT NULL CHECK (tipo_vehiculo IN ('auto', 'moto', 'ambos')),
    categoria TEXT NOT NULL CHECK (categoria IN ('base', 'extra')),
    nombre TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 80),
    descripcion TEXT,
    icono TEXT NOT NULL DEFAULT '🚿',
    precio BIGINT NOT NULL CHECK (precio >= 0 AND precio <= 100000000), -- en Gs.
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id, activo);

-- ============================================================================
-- 4. VEHICLES & FREQUENT CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plate TEXT NOT NULL CHECK (plate ~ '^[A-Z0-9 -]{3,15}$'),
    tipo TEXT NOT NULL DEFAULT 'auto' CHECK (tipo IN ('auto', 'moto')),
    marca TEXT,
    color TEXT,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, plate)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_business_plate ON public.vehicles(business_id, plate);

-- ============================================================================
-- 5. WASH JOBS (OPERACIÓN REAL DEL LAVADERO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wash_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    plate TEXT NOT NULL CHECK (plate ~ '^[A-Z0-9 -]{3,15}$'),
    tipo TEXT NOT NULL DEFAULT 'auto' CHECK (tipo IN ('auto', 'moto')),
    marca TEXT,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service TEXT NOT NULL CHECK (char_length(service) BETWEEN 2 AND 80),
    extras JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount BIGINT NOT NULL CHECK (amount BETWEEN 1 AND 100000000), -- total en Gs.
    state TEXT NOT NULL DEFAULT 'espera' CHECK (state IN ('espera', 'lavando', 'listo', 'entregado')),
    payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'pendiente')),
    token_publico TEXT NOT NULL UNIQUE,
    notas TEXT,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    inicio_lavado TIMESTAMPTZ,
    listo_en TIMESTAMPTZ,
    entregado_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((state = 'entregado' AND payment_method IS NOT NULL) OR (state <> 'entregado' AND payment_method IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_wash_jobs_business_created ON public.wash_jobs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wash_jobs_token ON public.wash_jobs(token_publico);
CREATE INDEX IF NOT EXISTS idx_wash_jobs_state ON public.wash_jobs(business_id, state);

-- Function and trigger to enforce sequential job transitions
CREATE OR REPLACE FUNCTION public.validate_job_transition() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT (
        (OLD.state = 'espera' AND NEW.state = 'lavando') OR
        (OLD.state = 'lavando' AND NEW.state = 'listo') OR
        (OLD.state = 'listo' AND NEW.state = 'entregado')
    ) THEN
        RAISE EXCEPTION 'Invalid transition';
    END IF;

    -- Timestamp tracking for operational metrics
    IF NEW.state = 'lavando' AND OLD.state = 'espera' THEN
        NEW.inicio_lavado := NOW();
    ELSIF NEW.state = 'listo' AND OLD.state = 'lavando' THEN
        NEW.listo_en := NOW();
    ELSIF NEW.state = 'entregado' AND OLD.state = 'listo' THEN
        NEW.entregado_en := NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_job_transition ON public.wash_jobs;
CREATE TRIGGER trg_validate_job_transition
    BEFORE UPDATE OF state ON public.wash_jobs
    FOR EACH ROW EXECUTE FUNCTION public.validate_job_transition();

-- ============================================================================
-- 6. PAYMENTS (COBROS) & EXPENSES (GASTOS DE CAJA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.wash_jobs(id) ON DELETE CASCADE,
    monto BIGINT NOT NULL CHECK (monto > 0),
    medio TEXT NOT NULL CHECK (medio IN ('efectivo', 'transferencia', 'pendiente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business_created ON public.payments(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL CHECK (char_length(concepto) BETWEEN 2 AND 120),
    monto BIGINT NOT NULL CHECK (monto > 0 AND monto <= 100000000),
    categoria TEXT NOT NULL DEFAULT 'insumos',
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business_fecha ON public.expenses(business_id, fecha DESC);

-- ============================================================================
-- 7. BILLING & SUBSCRIPTIONS (PADDLE SAAS INTEGRATION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    paddle_subscription_id TEXT UNIQUE NOT NULL,
    paddle_customer_id TEXT NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'semiannual', 'annual')),
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled')),
    access_until TIMESTAMPTZ,
    event_occurred_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.billing_checkouts (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    price_id TEXT,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'semiannual', 'annual')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consented_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.billing_events (
    event_id TEXT PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL
);

-- Checkout claim: prevents repeated simultaneous checkouts
CREATE OR REPLACE FUNCTION public.claim_checkout(p_business UUID, p_plan TEXT DEFAULT 'monthly') 
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
    PERFORM 1 FROM public.businesses WHERE id = p_business FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Business missing';
    END IF;

    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE business_id = p_business) THEN
        RAISE EXCEPTION 'Subscription already exists';
    END IF;

    IF EXISTS (SELECT 1 FROM public.billing_checkouts WHERE business_id = p_business AND started_at > NOW() - INTERVAL '10 minutes') THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.billing_checkouts (business_id, plan_type)
    VALUES (p_business, p_plan)
    ON CONFLICT (business_id) DO UPDATE SET
        started_at = NOW(),
        transaction_id = NULL,
        price_id = NULL,
        plan_type = EXCLUDED.plan_type,
        consented_at = NULL;

    RETURN TRUE;
END;
$$;

-- Apply billing event: idempotent, ordered event processing with advisory locks
CREATE OR REPLACE FUNCTION public.apply_billing_event(
    p_event TEXT,
    p_occurred TIMESTAMPTZ,
    p_subscription TEXT,
    p_customer TEXT,
    p_transaction TEXT,
    p_status TEXT,
    p_until TIMESTAMPTZ,
    p_price TEXT,
    p_plan TEXT DEFAULT 'monthly'
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_business UUID;
    v_previous TIMESTAMPTZ;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_subscription, 0));

    IF EXISTS (SELECT 1 FROM public.billing_events WHERE event_id = p_event) THEN
        RETURN;
    END IF;

    SELECT business_id, event_occurred_at INTO v_business, v_previous 
    FROM public.subscriptions 
    WHERE paddle_subscription_id = p_subscription;

    IF v_business IS NULL THEN
        SELECT business_id INTO v_business 
        FROM public.billing_checkouts 
        WHERE transaction_id = p_transaction AND price_id = p_price AND consented_at IS NOT NULL;

        IF v_business IS NULL THEN
            RAISE EXCEPTION 'No trusted checkout';
        END IF;

        PERFORM 1 FROM public.businesses WHERE id = v_business FOR UPDATE;
        IF EXISTS (SELECT 1 FROM public.subscriptions WHERE business_id = v_business) THEN
            RAISE EXCEPTION 'Subscription already linked';
        END IF;
    END IF;

    INSERT INTO public.billing_events (event_id, occurred_at) 
    VALUES (p_event, p_occurred);

    IF v_previous IS NOT NULL AND p_occurred <= v_previous THEN
        RETURN;
    END IF;

    INSERT INTO public.subscriptions (
        business_id, paddle_subscription_id, paddle_customer_id, plan_type, status, access_until, event_occurred_at
    ) VALUES (
        v_business, p_subscription, p_customer, COALESCE(p_plan, 'monthly'), p_status, p_until, p_occurred
    )
    ON CONFLICT (business_id) DO UPDATE SET
        plan_type = EXCLUDED.plan_type,
        status = EXCLUDED.status,
        access_until = EXCLUDED.access_until,
        event_occurred_at = EXCLUDED.event_occurred_at;
END;
$$;

-- Helper to seed default services for a newly created business
CREATE OR REPLACE FUNCTION public.seed_default_services(p_business_id UUID) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO public.services (business_id, tipo_vehiculo, categoria, nombre, descripcion, icono, precio, activo)
    VALUES
        (p_business_id, 'auto', 'base', 'Lavado Completo Auto', 'Carrocería exterior + aspirado de habitáculo', '🚗', 50000, TRUE),
        (p_business_id, 'auto', 'base', 'Lavado Básico Solo Exterior', 'Lavado a presión con champú neutro y secado', '🚿', 35000, TRUE),
        (p_business_id, 'auto', 'base', 'Lavado Premium + Cera', 'Lavado completo, encerado a mano y silicona', '✨', 80000, TRUE),
        (p_business_id, 'moto', 'base', 'Lavado Completo Moto', 'Desengrasado de cadena, lavado y secado', '🏍️', 25000, TRUE),
        (p_business_id, 'ambos', 'extra', 'Encerado Carnauba Líquida', 'Protección brillante para pintura', '🧽', 30000, TRUE),
        (p_business_id, 'ambos', 'extra', 'Limpieza Profunda Tapizado', 'Eliminación de manchas e higienización', '🧼', 60000, TRUE),
        (p_business_id, 'ambos', 'extra', 'Silicona y Perfume Premium', 'Aromatización y brillo en neumáticos/plásticos', '🧴', 15000, TRUE)
    ON CONFLICT DO NOTHING;
END;
$$;

COMMIT;
