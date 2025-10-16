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

  lines.forEach((line) => {
    // Check if line starts with ** (markdown heading)
    if (line.trim().startsWith('**') && line.includes('**', 2)) {
      const headingText = line.replace(/\*\*/g, '').trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 400; margin-bottom: 12px; margin-top: 20px; color: #000; text-align: left;">${headingText}</p>`)
    } else if (line.trim().startsWith('-')) {
      // Bullet point
      const bulletText = line.trim().substring(1).trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; text-align: left; padding-left: 0;">${bulletText}</p>`)
    } else if (line.trim() === '') {
      // Empty line for spacing
      htmlParts.push('<div style="height: 12px;"></div>')
    } else {
      // Regular text - check if it has a colon for label:value format
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0 && colonIndex < 50) {
        // Likely a label:value pair
        const label = line.substring(0, colonIndex + 1)
        const value = line.substring(colonIndex + 1).trim()
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; text-align: left;"><strong>${label}</strong> ${value}</p>`)
      } else {
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; text-align: left;">${line}</p>`)
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
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Eat Wild" width="32" height="32" style="display: block; margin-right: 12px;" />
                <span style="font-size: 20px; font-weight: 300; color: #000;">eat wild</span>
              </a>

              <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 20px; color: #000;">Thank you for booking!</h1>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;">Hi ${customerName},</p>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 20px; color: #333;">Your ticket for <strong>${ticket.event.title}</strong> has been confirmed.</p>

              <div style="background: #f5f3ed; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; font-weight: 400; margin-bottom: 12px; color: #000; text-align: left;">important details for attendees</h2>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>event:</strong> ${ticket.event.title}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>date:</strong> ${ticket.event.date}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>location:</strong> ${ticket.event.location}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: ${ticket.event.additionalDetails ? '8px' : '0'}; color: #333;"><strong>description:</strong> ${ticket.event.description}</p>
                ${ticket.event.additionalDetails ? `<div style="line-height: 1.6; margin-top: 20px;">${formatAdditionalDetailsForEmail(ticket.event.additionalDetails)}</div>` : ''}
              </div>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;">We look forward to seeing you!</p>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;">
                — The Eat Wild Team
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
