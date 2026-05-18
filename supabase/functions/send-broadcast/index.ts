import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info',
}

interface BroadcastPayload {
  title: string
  body?: string
  type?: string
  filterType?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const payload: BroadcastPayload = await req.json()

    if (!payload.title) {
      return new Response(JSON.stringify({ error: 'title é obrigatório' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    let query = supabase.from('profiles').select('id')
    if (payload.filterType) {
      query = query.eq('profile_type', payload.filterType)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(JSON.stringify({ error: usersError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!users?.length) {
      return new Response(JSON.stringify({ error: 'Nenhum usuário encontrado', sent: 0 }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const records = users.map(u => ({
      user_id: u.id,
      type: payload.type || 'broadcast',
      title: payload.title,
      body: payload.body || null,
      data: null,
      read: false,
    }))

    const CHUNK_SIZE = 500
    let sent = 0
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE)
      const { error: insertError } = await supabase.from('notifications').insert(chunk)
      if (insertError) {
        console.error('Chunk insert error:', insertError)
      } else {
        sent += chunk.length
      }
    }

    return new Response(JSON.stringify({ success: true, sent, total: users.length }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Broadcast error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
