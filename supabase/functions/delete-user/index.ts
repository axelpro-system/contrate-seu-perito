import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId é obrigatório' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const orderedTables = [
      { name: 'service_completions', columns: ['expert_id', 'client_id'] },
      { name: 'messages', columns: ['sender_id'] },
      { name: 'reviews', columns: ['expert_id', 'client_id'] },
      { name: 'leads', columns: ['expert_id', 'client_id'] },
      { name: 'appointments', columns: ['expert_id', 'client_id', 'cancelled_by'] },
      { name: 'audit_logs', columns: ['user_id'] },
      { name: 'commission_rates', columns: ['expert_id'] },
      { name: 'content_pages', columns: ['updated_by'] },
      { name: 'email_logs', columns: ['recipient_user_id'] },
      { name: 'notifications', columns: ['user_id'] },
      { name: 'support_tickets', columns: ['user_id', 'assigned_to', 'sender_id'] },
    ]

    for (const { name, columns } of orderedTables) {
      for (const column of columns) {
        const { error } = await supabase.from(name).delete().eq(column, userId)
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn(`Cleanup ${name}.${column}:`, error.message)
        }
      }
    }

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)
    if (profileError) {
      console.warn('Profile delete:', profileError)
    }

    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      return new Response(JSON.stringify({ error: `listUsers failed: ${listError.message}` }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const found = users.users.find(u => u.id === userId)
    if (!found) {
      return new Response(JSON.stringify({ success: true, note: 'user already deleted' }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Error deleting user:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
