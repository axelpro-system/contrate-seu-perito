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
  console.log('check-email-exists function invoked')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const { email } = await req.json()
    console.log('Received email to check:', email)

    if (!email) {
      console.error('Missing email in request')
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    console.log('Fetching all users from auth...')
    // List all users and find by email (case-insensitive)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('listUsers error:', listError)
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    console.log(`Found ${users.users.length} total users`)
    console.log('All user emails:', users.users.map(u => u.email))
    
    const emailLower = email.toLowerCase().trim()
    console.log('Looking for email (lowercase):', emailLower)
    
    const found = users.users.find(u => u.email?.toLowerCase().trim() === emailLower)
    console.log('Found user:', found)

    if (found) {
      console.log('User found! Returning exists: true')
      return new Response(JSON.stringify({ 
        exists: true, 
        userId: found.id,
        email: found.email,
        created_at: found.created_at 
      }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    console.log('User not found, returning exists: false')
    return new Response(JSON.stringify({ exists: false }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Error checking email:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
