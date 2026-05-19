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
  console.log('Function invoked:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    // Check environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasKey: !!SUPABASE_SERVICE_ROLE_KEY 
      })
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing environment variables' 
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const payload: CreateUserPayload = await req.json()
    console.log('Received payload:', { 
      email: payload.email, 
      firstName: payload.firstName, 
      lastName: payload.lastName,
      profileType: payload.profileType,
      accountStatus: payload.accountStatus 
    })

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
    console.log('Creating user with fullName:', fullName)

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
      console.error('No user ID returned from auth.createUser')
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário - nenhum ID retornado' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const userId = authData.user.id
    console.log('User created with ID:', userId)

    const profileData = {
      id: userId,
      email: payload.email,
      contact_email: payload.email,
      first_name: payload.firstName.trim() || null,
      last_name: payload.lastName.trim() || null,
      full_name: fullName || null,
      profile_type: payload.profileType,
      account_status: payload.accountStatus,
      profile_visible: payload.profileVisible,
    }
    console.log('Updating profile with data:', profileData)

    // Use update instead of upsert since trigger handle_new_user already creates the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return new Response(JSON.stringify({
        error: 'Usuário auth criado, mas erro ao criar perfil: ' + profileError.message,
        userId,
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Send welcome email
    console.log('Sending welcome email to:', payload.email)
    try {
      const profileTypeLabel = payload.profileType === 'PERITO' ? 'Perito' : 
                               payload.profileType === 'ADMIN' ? 'Administrador' : 'Contratante'
      
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: payload.email,
          subject: 'Bem-vindo ao Contrate um Perito!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Bem-vindo ao Contrate um Perito!</h2>
              <p>Olá ${fullName || payload.email},</p>
              <p>Sua conta foi criada com sucesso como <strong>${profileTypeLabel}</strong>.</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Email:</strong> ${payload.email}</p>
                <p style="margin: 10px 0 0 0;"><strong>Senha:</strong> ${payload.password}</p>
              </div>
              <p>Você pode acessar sua conta em: <a href="https://contrate-seu-perito.vercel.app/login">contrate-seu-perito.vercel.app/login</a></p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </div>
          `
        }
      })
      
      if (emailError) {
        console.error('Error sending welcome email:', emailError)
        // Don't fail the user creation if email fails
      } else {
        console.log('Welcome email sent successfully')
      }
    } catch (emailErr) {
      console.error('Exception sending welcome email:', emailErr)
      // Don't fail the user creation if email fails
    }

    console.log('User and profile created successfully')
    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Error creating user:', err)
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack')
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
