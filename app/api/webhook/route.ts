import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const resend = new Resend(process.env.RESEND_API_KEY)

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
              <div style="margin-bottom: 40px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Eat Wild" width="80" height="80" style="display: block;" />
              </div>

              <h1 style="font-size: 24px; font-weight: 400; margin-bottom: 20px; color: #000;">Thank you for booking!</h1>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;">Hi ${customerName},</p>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 20px; color: #333;">Your ticket for <strong>${ticket.event.title}</strong> has been confirmed.</p>

              <div style="background: #f5f3ed; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="font-size: 18px; font-weight: 400; margin-bottom: 12px; color: #000;">Event Details</h2>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>Event:</strong> ${ticket.event.title}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>Date:</strong> ${ticket.event.date}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333;"><strong>Location:</strong> ${ticket.event.location}</p>
                <p style="font-size: 16px; font-weight: 300; margin-bottom: 0; color: #333;"><strong>Description:</strong> ${ticket.event.description}</p>
              </div>

              <p style="font-size: 16px; font-weight: 300; margin-bottom: 20px; color: #333;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}" style="color: #000; text-decoration: underline;">View event details</a>
              </p>

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
