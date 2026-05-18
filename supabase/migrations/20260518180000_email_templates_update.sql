UPDATE public.email_templates SET html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td style="background:linear-gradient(135deg,#1a237e,#283593);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Bem-vindo ao Contrate um Perito!</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Olá <strong>{{name}}</strong>,</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">É com grande satisfação que damos as boas-vindas à plataforma <strong>Contrate um Perito</strong>! Sua conta foi criada com sucesso.</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">A partir de agora, você pode:</p>
        <table role="presentation" style="width:100%;margin:0 0 24px;">
          <tr><td style="padding:8px 0;color:#374151;font-size:15px;">✅ Encontrar peritos especializados para seu caso</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:15px;">✅ Solicitar cotações personalizadas</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:15px;">✅ Agendar consultas online</td></tr>
          <tr><td style="padding:8px 0;color:#374151;font-size:15px;">✅ Acompanhar tudo pelo seu painel</td></tr>
        </table>
        <div style="text-align:center;margin:32px 0;">
          <a href="{{site_url}}/dashboard" style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Acessar Painel</a>
        </div>
        <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0;">Se tiver dúvidas, responda a este email ou acesse nossa <a href="{{site_url}}/support" style="color:#1a237e;">Central de Ajuda</a>.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Contrate um Perito. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>' WHERE slug = 'welcome';

UPDATE public.email_templates SET html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td style="background:linear-gradient(135deg,#1a237e,#283593);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Nova Solicitação de Cotação</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Olá <strong>{{expert_name}}</strong>,</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Você recebeu uma nova solicitação de cotação de <strong>{{client_name}}</strong>.</p>
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:0 0 24px;">
          <p style="color:#374151;font-size:15px;line-height:1.5;margin:0 0 8px;"><strong>Mensagem do cliente:</strong></p>
          <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0;font-style:italic;">"{{message}}"</p>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="{{site_url}}/expert/quotes" style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Ver Solicitação</a>
        </div>
        <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0;">Quanto mais rápido responder, maiores as chances de fechar negócio!</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Contrate um Perito. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>' WHERE slug = 'new-lead';

UPDATE public.email_templates SET html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td style="background:linear-gradient(135deg,#16A34A,#15803D);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Agendamento Confirmado! ✅</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Olá <strong>{{client_name}}</strong>,</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Seu agendamento foi confirmado! Aqui estão os detalhes:</p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:20px;margin:0 0 24px;">
          <table role="presentation" style="width:100%;">
            <tr><td style="padding:6px 0;color:#374151;font-size:15px;"><strong>Perito:</strong> {{expert_name}}</td></tr>
            <tr><td style="padding:6px 0;color:#374151;font-size:15px;"><strong>Data:</strong> {{date}}</td></tr>
            <tr><td style="padding:6px 0;color:#374151;font-size:15px;"><strong>Horário:</strong> {{time}}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="{{site_url}}/my-appointments" style="display:inline-block;background:#16A34A;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Ver Agendamentos</a>
        </div>
        <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0;">Se precisar cancelar ou reagendar, acesse seu painel com até 24h de antecedência.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Contrate um Perito. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>' WHERE slug = 'appointment-confirmed';

UPDATE public.email_templates SET html_body = '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:32px 16px;">
    <tr>
      <td style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">Redefinição de Senha</h1>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Olá,</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Recebemos uma solicitação de redefinição de senha para sua conta no <strong>Contrate um Perito</strong>.</p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 20px;">Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="{{reset_link}}" style="display:inline-block;background:#DC2626;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">Redefinir Senha</a>
        </div>
        <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0 0 12px;">Se você não solicitou esta redefinição, ignore este email.</p>
        <p style="color:#9CA3AF;font-size:13px;line-height:1.5;margin:0;">Este link expira em 1 hora por segurança.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;text-align:center;">
        <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Contrate um Perito. Todos os direitos reservados.</p>
      </td>
    </tr>
  </table>
</body>
</html>' WHERE slug = 'password-reset';

UPDATE public.email_templates SET variables = '{name,site_url}' WHERE slug = 'welcome';
UPDATE public.email_templates SET variables = '{expert_name,client_name,message,site_url}' WHERE slug = 'new-lead';
UPDATE public.email_templates SET variables = '{client_name,expert_name,date,time,site_url}' WHERE slug = 'appointment-confirmed';
UPDATE public.email_templates SET variables = '{reset_link}' WHERE slug = 'password-reset';
