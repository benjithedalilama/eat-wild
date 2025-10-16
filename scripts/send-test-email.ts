import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

function formatAdditionalDetailsForEmail(text: string): string {
  const lines = text.toLowerCase().split('\n')
  const htmlParts: string[] = []
  let previousLocationName = ''

  lines.forEach((line) => {
    if (line.trim().startsWith('**') && line.includes('**', 2)) {
      const headingText = line.replace(/\*\*/g, '').trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 400; margin-bottom: 12px; margin-top: 20px; color: #000; line-height: 1.6;">${headingText}</p>`)
    } else if (line.trim().startsWith('-')) {
      const bulletText = line.trim().substring(1).trim()
      htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;">${bulletText}</p>`)
    } else if (line.trim() === '') {
      htmlParts.push('<div style="height: 12px;"></div>')
    } else if (line.trim().startsWith('http://') || line.trim().startsWith('https://')) {
      const url = line.trim()
      if (previousLocationName) {
        const lastIndex = htmlParts.length - 1
        htmlParts[lastIndex] = `<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;"><a href="${url}" style="color: #000; text-decoration: underline;">${previousLocationName}</a></p>`
        previousLocationName = ''
      }
    } else {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0 && colonIndex < 50) {
        const label = line.substring(0, colonIndex + 1)
        const value = line.substring(colonIndex + 1).trim()
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;"><span style="font-weight: 400;">${label}</span> ${value}</p>`)
      } else {
        previousLocationName = line.trim()
        htmlParts.push(`<p style="font-size: 16px; font-weight: 300; margin-bottom: 8px; color: #333; line-height: 1.6;">${line}</p>`)
      }
    }
  })

  return htmlParts.join('')
}

async function main() {
  const customerEmail = 'ben.imadali@gmail.com'
  const customerName = 'Ben'
  const eventId = 'sf-sunset-mussels-2024'

  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  })

  if (!event) {
    throw new Error('Event not found')
  }

  // Create a test ticket
  const ticket = await prisma.ticket.create({
    data: {
      eventId,
      customerName,
      customerEmail,
      stripeSessionId: `test_email_${Date.now()}`,
    },
    include: {
      event: true,
    },
  })

  // Send email
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
  console.log('Test ticket created:', ticket.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
