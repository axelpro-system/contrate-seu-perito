// Supabase Edge Function: send-status-update
// Sends status update notification emails to experts

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

// Status labels in Portuguese
const STATUS_LABELS: { [key: string]: string } = {
  'draft': 'Rascunho',
  'submitted': 'Enviado para Análise',
  'under_review': 'Em Revisão',
  'approved': 'Aprovado',
  'rejected': 'Rejeitado'
}

// Status colors for email styling
const STATUS_COLORS: { [key: string]: string } = {
  'draft': '#616161',
  'submitted': '#e65100',
  'under_review': '#1565c0',
  'approved': '#2e7d32',
  'rejected': '#c62828'
}

// Status messages
const STATUS_MESSAGES: { [key: string]: string } = {
  'draft': 'Seu cadastro está em modo rascunho. Complete todas as informações e documentos para enviar.',
  'submitted': 'Recebemos seu cadastro! Nossa equipe irá revisar suas informações e documentação em breve.',
  'under_review': 'Seu cadastro está sendo analisado por nossa equipe técnica. Este processo pode levar até 5 dias úteis.',
  'approved': 'Parabéns! Seu cadastro foi aprovado. Você já pode acessar seu painel e começar a receber solicitações.',
  'rejected': 'Seu cadastro não foi aprovado neste momento. Verifique o motivo abaixo e entre em contato se necessário.'
}

function generateStatusUpdateEmail(
  expertName: string,
  oldStatus: string,
  newStatus: string,
  reason?: string,
  dashboardUrl?: string
): string {
  const statusLabel = STATUS_LABELS[newStatus] || newStatus
  const statusColor = STATUS_COLORS[newStatus] || '#000000'
  const statusMessage = STATUS_MESSAGES[newStatus] || 'Status atualizado.'
  const oldStatusLabel = STATUS_LABELS[oldStatus] || oldStatus || 'Início'
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px;background:linear-gradient(135deg,#1a237e 0%,#007AFF 100%);border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Contrate um Perito</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#333333;font-size:20px;font-weight:600;margin:0 0 16px;">Olá, ${expertName}!</h2>
              
              <p style="color:#666666;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Houve uma atualização no status do seu cadastro:
              </p>

              <!-- Status Change Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <span style="color:#999999;font-size:14px;">Status Anterior:</span>
                          <span style="color:#666666;font-size:16px;font-weight:600;float:right;">${oldStatusLabel}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #e0e0e0;padding-top:12px;">
                          <span style="color:#999999;font-size:14px;">Novo Status:</span>
                          <span style="color:${statusColor};font-size:18px;font-weight:700;float:right;">${statusLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Message -->
              <div style="background:#e3f2fd;border-left:4px solid #2196f3;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
                <p style="color:#1565c0;font-size:15px;line-height:1.6;margin:0;">
                  ${statusMessage}
                </p>
              </div>

              ${reason ? `
              <!-- Reason (if provided) -->
              <div style="background:#fff3e0;border:1px solid #ff9800;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="color:#e65100;font-size:14px;font-weight:600;margin:0 0 8px;">Informações Adicionais:</p>
                <p style="color:#666666;font-size:14px;line-height:1.5;margin:0;">${reason}</p>
              </div>
              ` : ''}

              ${dashboardUrl && newStatus === 'approved' ? `
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
                <tr>
                  <td align="center" style="background:#1a237e;border-radius:8px;">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Acessar Meu Painel
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Timeline Info -->
              <div style="border-top:1px solid #e0e0e0;padding-top:24px;margin-top:24px;">
                <p style="color:#999999;font-size:13px;line-height:1.5;margin:0;">
                  <strong>Próximos passos:</strong><br>
                  ${newStatus === 'submitted' ? 'Você receberá um email quando seu cadastro começar a ser revisado.' : ''}
                  ${newStatus === 'under_review' ? 'Nossa equipe está analisando seus documentos. Aguarde o resultado final.' : ''}
                  ${newStatus === 'approved' ? 'Seu perfil já está visível para contratantes. Complete seu perfil para receber mais solicitações.' : ''}
                  ${newStatus === 'rejected' ? 'Você pode corrigir as informações e enviar novamente, ou entrar em contato com nosso suporte.' : ''}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:24px 32px;border-radius:0 0 8px 8px;">
              <p style="color:#999999;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                © ${new Date().getFullYear()} Contrate um Perito. Todos os direitos reservados.<br>
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const { expertId, oldStatus, newStatus, reason, sendEmail = true } = await req.json()

    if (!expertId || !newStatus) {
      return new Response(JSON.stringify({ 
        error: 'expertId e newStatus são obrigatórios',
        code: 'MISSING_PARAMS'
      }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get expert profile
    const { data: expert, error: expertError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, contact_email, email')
      .eq('id', expertId)
      .single()

    if (expertError || !expert) {
      console.error('Expert not found:', expertError)
      return new Response(JSON.stringify({ 
        error: 'Perito não encontrado',
        code: 'EXPERT_NOT_FOUND'
      }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const expertName = `${expert.first_name || ''} ${expert.last_name || ''}`.trim() || 'Perito'
    const expertEmail = expert.contact_email || expert.email

    if (!expertEmail) {
      console.error('Expert has no email')
      return new Response(JSON.stringify({ 
        error: 'Perito não possui email cadastrado',
        code: 'NO_EMAIL'
      }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    // Generate dashboard URL
    const dashboardUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/expert-dashboard`

    // Generate email HTML
    const emailHtml = generateStatusUpdateEmail(
      expertName,
      oldStatus,
      newStatus,
      reason,
      dashboardUrl
    )

    // Send email via Resend
    let emailResult = null
    if (sendEmail && RESEND_API_KEY) {
      const statusLabel = STATUS_LABELS[newStatus] || newStatus
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [expertEmail],
          subject: `Atualização de Status - ${statusLabel}`,
          html: emailHtml,
        }),
      })

      emailResult = await res.json()

      if (!res.ok) {
        console.error('Resend API error:', emailResult)
        // Don't fail the entire operation if email fails, just log it
      } else {
        console.log('Status update email sent:', emailResult.id)
      }
    }

    // Log the notification in email_logs table
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: expertEmail,
        recipient_user_id: expertId,
        email_type: 'status_update',
        subject: `Atualização de Status - ${STATUS_LABELS[newStatus]}`,
        status: emailResult?.id ? 'sent' : 'failed',
        error_message: emailResult?.id ? null : JSON.stringify(emailResult),
      })

    if (logError) {
      console.error('Error logging email:', logError)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: !!emailResult?.id,
      emailId: emailResult?.id || null,
      message: 'Notificação de status enviada com sucesso'
    }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })

  } catch (err) {
    console.error('Error in send-status-update:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      code: 'UNKNOWN_ERROR'
    }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
