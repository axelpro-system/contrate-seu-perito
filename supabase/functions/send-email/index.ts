// Supabase Edge Function: send-email
// Sends transactional emails via Resend API

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'naoresponder@axelpro.com.br'
const FROM_NAME = 'Contrate um Perito'

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info',
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  from_name?: string
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  try {
    const payload: EmailPayload = await req.json()

    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: to, subject, html',
        code: 'MISSING_FIELDS'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!isValidEmail(payload.to)) {
      return new Response(JSON.stringify({ 
        error: `Invalid email format: ${payload.to}`,
        code: 'INVALID_EMAIL'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ 
        error: 'Email service not configured',
        code: 'NOT_CONFIGURED'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    console.log(`[send-email] Starting: to=${payload.to}, subject=${payload.subject}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${payload.from_name || FROM_NAME} <${FROM_EMAIL}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', JSON.stringify(data))
      
      const errorMessage = data?.message || data?.error?.message || JSON.stringify(data)
      let errorCode = 'SEND_ERROR'
      
      if (errorMessage.includes('5.1.1') || errorMessage.includes('does not exist')) {
        errorCode = 'BOUNCE_INVALID_RECIPIENT'
      } else if (errorMessage.includes('5.7.1') || errorMessage.includes('rejected') || errorMessage.includes('spam')) {
        errorCode = 'BOUNCE_REJECTED'
      } else if (errorMessage.includes('5.4.1') || errorMessage.includes('relay')) {
        errorCode = 'BOUNCE_RELAY_DENIED'
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        code: errorCode,
        details: data
      }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    console.log('Email sent successfully:', data.id)

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    console.error('Error sending email:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      code: 'UNKNOWN_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
