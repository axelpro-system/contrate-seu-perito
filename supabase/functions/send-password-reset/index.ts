// Supabase Edge Function: send-password-reset
// Sends password reset email via Resend API

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'noreply@axelpro.com.br'
const FROM_NAME = 'Contrate um Perito'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, apikey',
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const { email, redirectUrl } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email é obrigatório',
        code: 'MISSING_EMAIL'
      }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ 
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL'
      }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Serviço de email não configurado',
        code: 'NOT_CONFIGURED'
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      return new Response(JSON.stringify({ 
        error: 'Erro ao verificar usuário',
        code: 'LIST_ERROR'
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Se o email existir, você receberá instruções de recuperação.'
      }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Generate a simple token (in production, use a more secure method)
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

    // Store token in a custom table or use Supabase's built-in recovery
    // For now, we'll use Supabase's generateLink method
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl || `${SUPABASE_URL}/reset-password`
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar link de recuperação',
        code: 'LINK_ERROR'
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const recoveryUrl = linkData.properties?.action_link

    if (!recoveryUrl) {
      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar link de recuperação',
        code: 'NO_LINK'
      }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: 'Redefinição de Senha - Contrate um Perito',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Redefinição de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${recoveryUrl}" 
                 style="background: #1a237e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${recoveryUrl}</p>
            <p style="margin-top: 20px;"><strong>Este link expira em 1 hora.</strong></p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Se você não solicitou esta redefinição, ignore este email.<br>
              Este é um email automático, não responda.
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', data)
      return new Response(JSON.stringify({ 
        error: data?.message || 'Erro ao enviar email',
        code: 'SEND_ERROR'
      }), {
        status: res.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email de recuperação enviado com sucesso'
    }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })

  } catch (err) {
    console.error('Error in send-password-reset:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      code: 'UNKNOWN_ERROR'
    }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
