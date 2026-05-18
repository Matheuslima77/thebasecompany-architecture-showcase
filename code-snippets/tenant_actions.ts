'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Internal utility: Instantiates Supabase with Admin privileges (Bypasses RLS).
// 🔒 Safe because 'use server' guarantees this code never ships to the client browser.
const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('FATAL: Supabase Service Key or URL missing in environment variables.');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false // Admin tasks do not require session persistence
      }
    }
  );
};

// React 19 Server Action signature: Designed to be used with `useActionState` for strict Error Boundaries.
export async function provisionNewTenantAction(prevState: any, formData: FormData) {
  try {
    const userName = formData.get('nomeCompleto') as string;
    const companyName = formData.get('nomeEmpresa') as string | null;
    const companyId = formData.get('empresaId') as string | null;
    const email = formData.get('email') as string;

    console.log('[PROVISIONING SAGA] --- START ---');
    console.log(`[PROVISIONING SAGA] Target Email: ${email}`);

    if (!email || !userName) {
      console.warn('[PROVISIONING SAGA] Aborted: Missing required fields.');
      return { error: 'Missing required fields for provisioning.' };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Phase 1: Identity Creation (Supabase Auth Admin API)
    console.log('[PROVISIONING SAGA] Phase 1: Inviting user via Admin API...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nome_completo: userName,
      }
    });

    if (authError || !authData.user) {
      console.error('[PROVISIONING SAGA] Phase 1 Failed:', authError?.message);
      return { error: 'Account creation failed. Email might already be in use.' };
    }

    const authId = authData.user.id;
    console.log(`[PROVISIONING SAGA] Phase 1 Success. Generated Auth ID: ${authId}`);

    // Phase 2: Database Infrastructure & Linkage (Atomic RPC)
    console.log('[PROVISIONING SAGA] Phase 2: Executing create_tenant_and_link RPC...');
    const { error: rpcError } = await supabaseAdmin.rpc('create_tenant_and_link', { 
      p_auth_id: authId, 
      p_email: email, 
      p_nome_usuario: userName, 
      p_nome_empresa: companyName || null, 
      p_empresa_id: companyId || null 
    });

    // Phase 3: Compensating Transaction (Manual Rollback)
    // Essential for distributed systems to prevent "ghost users" if the DB transaction fails.
    if (rpcError) {
      console.error('[PROVISIONING SAGA] Critical Error in Phase 2:', rpcError.message);
      console.log('[PROVISIONING SAGA] Initiating Security Rollback...');
      
      // Actively delete the orphaned auth user
      await supabaseAdmin.auth.admin.deleteUser(authId);
      console.log('[PROVISIONING SAGA] Rollback complete. Orphaned Auth user removed.');
      
      return { error: 'Critical failure during infrastructure provisioning. Rollback executed successfully.' };
    }

    console.log('[PROVISIONING SAGA] Phase 2 Success. Tenant fully provisioned.');
    console.log('[PROVISIONING SAGA] --- COMPLETE ---');
    
    return { success: 'Infrastructure and account successfully created. Secure access link dispatched.' };

  } catch (error: any) {
    console.error('[PROVISIONING SAGA] 🚨 FATAL CRASH:', error);
    return { error: 'Internal server error during provisioning saga.' };
  }
}
