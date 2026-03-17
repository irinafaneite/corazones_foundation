import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Metadata contains event_id (passed via URL parameter in frontend)
      const eventId = session.metadata?.event_id
      const userEmail = session.customer_details?.email
      const userName = session.customer_details?.name

      if (!eventId) {
        // Just ignore non-event payments or donations that aren't for an event
        return new Response(JSON.stringify({ message: 'Not an event payment, skipping' }), { status: 200 })
      }

      if (!userEmail) {
        console.error('Missing customer email', { eventId })
        return new Response('Missing information', { status: 400 })
      }

      // 1. Initialize Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 2. Save registration to database
      const { data: registration, error: dbError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          email: userEmail,
          user_name: userName,
          stripe_session_id: session.id,
          amount_total: (session.amount_total ?? 0) / 100,
          currency: session.currency,
          status: 'completed'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        return new Response('Database error', { status: 500 })
      }

      // 3. Get event details and photos for the email
      const { data: eventData } = await supabase
        .from('events')
        .select('*, event_photos(*)')
        .eq('id', eventId)
        .single()

      const eventImageUrl = eventData?.event_photos?.[0]?.url || ''
      const isLocalImage = eventImageUrl.includes('127.0.0.1') || eventImageUrl.includes('localhost')
      
      const formattedDate = eventData ? new Date(eventData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : ''

      const currency = session.currency?.toUpperCase() || 'USD'
      const amountTotal = ((session.amount_total ?? 0) / 100).toFixed(2)

      // 4. Send Confirmation Email via Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (resendApiKey && eventData) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Corazones of Courage <info@corazonesofcouragefoundation.org>', 
            to: [userEmail],
            subject: `Confirmation: ${eventData.title}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; color: #1a1a1a; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { background-color: #1A1A1A; padding: 40px 20px; text-align: center; }
        .logo { width: 70px; }
        .hero { width: 100%; height: 300px; object-fit: cover; }
        .content { padding: 40px 30px; }
        .badge { display: inline-block; padding: 4px 12px; background-color: #fef2f2; color: #f43f5e; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; border: 1px solid #fee2e2; }
        h1 { color: #1a1a1a; font-size: 32px; font-weight: 800; margin-top: 0; margin-bottom: 20px; letter-spacing: -0.5px; }
        p { line-height: 1.8; font-size: 16px; color: #4b5563; }
        .details-box { background-color: #f9fafb; padding: 30px; border-radius: 16px; margin: 35px 0; border: 1px solid #f3f4f6; }
        .detail-item { margin-bottom: 20px; }
        .detail-item:last-child { margin-bottom: 0; }
        .detail-label { font-weight: 700; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block; }
        .detail-value { font-weight: 600; color: #111827; font-size: 16px; }
        .footer { background-color: #ffffff; padding: 50px 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .button { display: inline-block; padding: 18px 36px; background-color: #f43f5e; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin-top: 25px; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2); }
        .logo-container { background-color: #1A1A1A; display: inline-block; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
        .footer-logo { width: 40px; display: block; margin: 0 auto; }
        .accent { color: #f43f5e; font-weight: 700; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://corazonesofcouragefoundation.org" style="text-decoration: none;">
                <img src="https://corazonesofcouragefoundation.org/logo-blanco.png" alt="Corazones of Courage" class="logo">
            </a>
        </div>
        ${!isLocalImage && eventImageUrl ? `<img src="${eventImageUrl}" alt="${eventData.title}" class="hero">` : ''}
        <div class="content">
            <div class="badge">Registration Confirmed</div>
            <h1>You're Going!</h1>
            <p>Hi <strong>${userName || 'Friend'}</strong>,</p>
            <p>Your spot for <span class="accent">${eventData.title}</span> is officially secured. We've received your registration and payment. Thank you for being part of our mission to create a safer future for everyone.</p>
            
            <div class="details-box">
                <div class="detail-item">
                    <span class="detail-label">When</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Where</span>
                    <span class="detail-value">${eventData.location || 'To be announced'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Reservation Contribution</span>
                    <span class="detail-value">$${amountTotal} ${currency}</span>
                </div>
            </div>

            <p>Please keep this email as your ticket confirmation. We can't wait to see you there!</p>
            
            <div style="text-align: center;">
                <a href="https://corazonesofcouragefoundation.org/events.html" class="button">See Other Events</a>
            </div>
        </div>
        <div class="footer">
            <div class="logo-container">
                <img src="https://corazonesofcouragefoundation.org/logo-blanco.png" alt="Foundation Logo" class="footer-logo">
            </div>
            <p><strong>Corazones of Courage Foundation</strong></p>
            <p>A 501(c)(3) nonprofit organization dedicated to the prevention and care of gender-based violence.</p>
            <p style="margin-top: 25px; font-size: 12px; letter-spacing: 0.5px;">
                Houston, Texas<br>
                <a href="https://corazonesofcouragefoundation.org" style="color: #f43f5e; text-decoration: none; font-weight: 600;">Visit our Website</a>
            </p>
        </div>
    </div>
</body>
</html>
`,
          }),
        })

        if (!emailRes.ok) {
          const errorText = await emailRes.text()
          console.error('Resend email error:', errorText)
        }
      }

      console.log('Successfully processed registration:', registration?.id)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
