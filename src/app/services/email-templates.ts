export const APP_NAME = 'Contrate um Perito'
export const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://axelpro.com.br'
export const PRIMARY_COLOR = '#007AFF'
export const BG_COLOR = '#F8F9FA'

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 24px;background:linear-gradient(135deg,#1a237e 0%,${PRIMARY_COLOR} 100%);border-radius:16px 16px 0 0;">
              <img src="${APP_URL}/assets/logo-white.png" alt="${APP_NAME}" height="40" style="display:block;margin:0 auto;" onerror="this.style.display='none'">
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:16px 0 0;letter-spacing:-0.5px;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:32px 32px 24px;border-radius:0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1F2937;padding:24px 32px;border-radius:0 0 16px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0;">
                      © ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.
                    </p>
                    <p style="color:#6B7280;font-size:12px;margin:8px 0 0;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr>
      <td align="center" style="background:${PRIMARY_COLOR};border-radius:8px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function separator(): string {
  return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">`
}

export interface LeadEmailData {
  expertName: string
  clientName: string
  caseDescription: string
  expertQuotesUrl: string
}

export function newLeadEmail(data: LeadEmailData): string {
  return baseLayout(`
    <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 8px;">Nova Cotação Recebida! 🎯</h2>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Olá <strong style="color:#1F2937;">${data.expertName}</strong>,
    </p>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Um contratante está interessado em seus serviços profissionais.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:8px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px;">
          <p style="color:#1F2937;font-size:14px;font-weight:600;margin:0 0 4px;">Cliente</p>
          <p style="color:#6B7280;font-size:14px;margin:0 0 12px;">${data.clientName}</p>
          <p style="color:#1F2937;font-size:14px;font-weight:600;margin:0 0 4px;">Descrição do caso</p>
          <p style="color:#6B7280;font-size:14px;margin:0;line-height:1.5;">${data.caseDescription}</p>
        </td>
      </tr>
    </table>
    ${ctaButton(data.expertQuotesUrl, 'Ver Leads')}
    ${separator()}
    <p style="color:#9CA3AF;font-size:13px;margin:0;">Acesse seu painel para responder à solicitação.</p>
  `)
}

export interface QuoteResponseEmailData {
  clientName: string
  proposedValue: string
  deadline: string
  notes: string
  dashboardUrl: string
}

export function quoteResponseEmail(data: QuoteResponseEmailData): string {
  return baseLayout(`
    <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 8px;">Proposta Recebida! 📋</h2>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Olá <strong style="color:#1F2937;">${data.clientName}</strong>,
    </p>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
      O perito respondeu sua solicitação de cotação com uma proposta. Veja os detalhes:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:8px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#6B7280;font-size:14px;">Valor:</span>
                <span style="color:#059669;font-size:16px;font-weight:700;float:right;">R$ ${data.proposedValue}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;border-top:1px solid #E5E7EB;">
                <span style="color:#6B7280;font-size:14px;">Prazo:</span>
                <span style="color:#1F2937;font-size:14px;font-weight:600;float:right;">${data.deadline}</span>
              </td>
            </tr>
            ${data.notes ? `<tr><td style="padding:4px 0;border-top:1px solid #E5E7EB;">
              <span style="color:#6B7280;font-size:14px;display:block;margin-bottom:4px;">Observações:</span>
              <span style="color:#1F2937;font-size:14px;line-height:1.5;">${data.notes}</span>
            </td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    ${ctaButton(data.dashboardUrl, 'Ver Proposta')}
    ${separator()}
    <p style="color:#9CA3AF;font-size:13px;margin:0;">Aceite ou recuse a proposta pelo seu painel.</p>
  `)
}

export interface ApprovalEmailData {
  expertName: string
  dashboardUrl: string
}

export function approvalEmail(data: ApprovalEmailData): string {
  return baseLayout(`
    <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 8px;">Cadastro Aprovado! ✅</h2>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
      Parabéns <strong style="color:#1F2937;">${data.expertName}</strong>,
    </p>
    <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 8px;">
      Seu cadastro como perito foi <strong style="color:#059669;">aprovado</strong>!
    </p>
    <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:8px 16px;background:#F3F4F6;border-radius:8px;font-size:14px;color:#1F2937;">📩 Receber solicitações de cotação</td>
      </tr>
      <tr>
        <td style="padding:8px 16px;background:#F3F4F6;border-radius:8px;font-size:14px;color:#1F2937;">💬 Enviar propostas e orçamentos</td>
      </tr>
      <tr>
        <td style="padding:8px 16px;background:#F3F4F6;border-radius:8px;font-size:14px;color:#1F2937;">📈 Expandir sua rede de clientes</td>
      </tr>
    </table>
    ${ctaButton(data.dashboardUrl, 'Acessar Painel')}
    ${separator()}
    <p style="color:#9CA3AF;font-size:13px;margin:0;">Comece agora a configurar seu perfil e receber novos leads!</p>
  `)
}
