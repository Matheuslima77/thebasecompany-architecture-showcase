-- Function: create_tenant_and_link
-- Purpose: Atomic provisioning of new Tenants (Real Estate Agencies) and linking the initial Auth User.
-- Architecture: Replaces fragile database triggers with a single, atomic RPC call. Uses SECURITY DEFINER to bypass RLS safely during provisioning.

CREATE OR REPLACE FUNCTION public.create_tenant_and_link(
    p_auth_id uuid,
    p_email text,
    p_nome_usuario text,
    p_empresa_id uuid DEFAULT NULL,
    p_nome_empresa text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Elevates privileges strictly for the provisioning transaction
AS $$
DECLARE
    v_empresa_id uuid;
BEGIN
    -- Phase 1: Tenant Routing
    -- Check if the system is linking the user to an existing real estate agency
    IF p_empresa_id IS NOT NULL THEN
        v_empresa_id := p_empresa_id;
    ELSE
        -- Admin is creating a completely new Tenant
        IF p_nome_empresa IS NULL OR trim(p_nome_empresa) = '' THEN
            RAISE EXCEPTION 'INTEGRITY FAULT: For a new tenant, the company name is mandatory.';
        END IF;

        -- Atomically insert the new agency and capture the generated UUID
        INSERT INTO public.empresas (nome)
        VALUES (p_nome_empresa)
        RETURNING id INTO v_empresa_id;
    END IF;

    -- Phase 2: Identity Linkage (Team)
    -- Insert the broker/owner profile, mapping the Auth ID as the Primary Key.
    -- Uses strict UPSERT logic (ON CONFLICT) to guarantee idempotency and avoid collision errors on retries.
    INSERT INTO public.equipe (id, empresa_id, nome, email)
    VALUES (p_auth_id, v_empresa_id, p_nome_usuario, p_email)
    ON CONFLICT (id) DO UPDATE
    SET
        empresa_id = EXCLUDED.empresa_id,
        nome = EXCLUDED.nome,
        email = EXCLUDED.email;

END;
$$;
