import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, apikey',
}

interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  profileType: string
  accountStatus: string
  profileVisible: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const payload: CreateUserPayload = await req.json()

    if (!payload.email || !payload.password) {
      return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (payload.password.length < 6) {
      return new Response(JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const fullName = `${payload.firstName} ${payload.lastName}`.trim()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        profile_type: payload.profileType,
      },
    })

    if (authError) {
      console.error('Auth createUser error:', authError)
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!authData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário - nenhum ID retornado' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const userId = authData.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: payload.email,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        full_name: fullName,
        profile_type: payload.profileType,
        account_status: payload.accountStatus,
        profile_visible: payload.profileVisible,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return new Response(JSON.stringify({
        error: 'Usuário auth criado, mas erro ao criar perfil: ' + profileError.message,
        userId,
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Error creating user:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
