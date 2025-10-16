import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const resend = new Resend(process.env.RESEND_API_KEY)

function formatAdditionalDetailsForEmail(text: string): string {
  // Convert to lowercase and split into lines
  const lines = text.toLowerCase().split('\n')
  const htmlParts: string[] = []
  let previousLocationName = ''

  lines.forEach((line, index) => {
    // Check if line starts with ** (markdown heading)
    if (line.trim().startsWith('**') && line.includes('**', 2)) {
      const headingText = line.replace(/\*\*/g, '').trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 400; margin-bottom: 12px; margin-top: 20px; color: #000; line-height: 1.6;">${headingText}</p>`)
    } else if (line.trim().startsWith('-')) {
      // Bullet point
      const bulletText = line.trim().substring(1).trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;">${bulletText}</p>`)
    } else if (line.trim() === '') {
      // Empty line for spacing
      htmlParts.push('<div style="height: 12px;"></div>')
    } else if (line.trim().startsWith('http://') || line.trim().startsWith('https://')) {
      // URL line - convert previous location name to hyperlink if it exists
      const url = line.trim()
      if (previousLocationName) {
        // Replace the last added item (the location name) with a linked version
        const lastIndex = htmlParts.length - 1
        htmlParts[lastIndex] = `<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;"><a href="${url}" style="color: #000; text-decoration: underline;">${previousLocationName}</a></p>`
        previousLocationName = ''
      }
      // Don't add the raw URL as a separate line
    } else {
      // Regular text - check if it has a colon for label:value format
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0 && colonIndex < 50) {
        // Likely a label:value pair
        const label = line.substring(0, colonIndex + 1)
        const value = line.substring(colonIndex + 1).trim()
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;"><span style="font-weight: 400;">${label}</span> ${value}</p>`)
      } else {
        // Store this as potential location name for next URL
        previousLocationName = line.trim()
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;">${line}</p>`)
      }
    }
  })

  return htmlParts.join('')
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const { eventId, customerName, customerEmail } = session.metadata as {
      eventId: string
      customerName: string
      customerEmail: string
    }

    try {
      // Create ticket in database
      const ticket = await prisma.ticket.create({
        data: {
          eventId,
          customerName,
          customerEmail,
          stripeSessionId: session.id,
        },
        include: {
          event: true,
        },
      })

      // Send confirmation email
      if (process.env.RESEND_API_KEY) {
        try {
          const emailResult = await resend.emails.send({
            from: 'Eat Wild <events@benimadali.com>',
            to: customerEmail,
            subject: `Your ticket for ${ticket.event.title}`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: flex; align-items: center; margin-bottom: 40px; text-decoration: none;">
                <img src="https://eat-wild.vercel.app/logo-email.png" alt="Eat Wild" width="32" height="32" style="display: block; margin-right: 12px;" />
                <span style="font-size: 20px; font-weight: 300; color: #000;">eat wild</span>
              </a>

              <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 16px; color: #000; line-height: 1.6;">thank you for booking!</h1>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 16px; color: #333; line-height: 1.6;">hi ${customerName},</p>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 24px; color: #333; line-height: 1.6;">your ticket for <span style="font-weight: 400;">${ticket.event.title}</span> has been confirmed.</p>

              <div style="background: #f5f3ed; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
                <h2 style="font-size: 18px; font-weight: 400; margin-bottom: 16px; color: #000; line-height: 1.6;">important details for attendees</h2>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;"><span style="font-weight: 400;">event:</span> ${ticket.event.title}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: ${ticket.event.additionalDetails ? '8px' : '0'}; color: #333; line-height: 1.6;"><span style="font-weight: 400;">date:</span> ${ticket.event.date}</p>
                ${ticket.event.additionalDetails ? `<div style="margin-top: 20px;">${formatAdditionalDetailsForEmail(ticket.event.additionalDetails)}</div>` : ''}
              </div>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 16px; color: #333; line-height: 1.6;">we look forward to seeing you!</p>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 0; color: #333; line-height: 1.6;">
                — the eat wild team
              </p>
            </div>
          `,
          })
          console.log('Email sent successfully:', emailResult)
        } catch (emailError) {
          console.error('Error sending email:', emailError)
        }
      }

      console.log('Ticket created:', ticket.id)
    } catch (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
