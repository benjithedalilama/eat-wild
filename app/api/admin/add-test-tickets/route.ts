import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const eventId = 'sf-sunset-mussels-2024'

    // Create 19 test tickets
    const ticketsToCreate = []
    for (let i = 1; i <= 19; i++) {
      ticketsToCreate.push({
        eventId,
        customerName: `Test Customer ${i}`,
        customerEmail: `test${i}@example.com`,
        stripeSessionId: `test_session_${Date.now()}_${i}`,
      })
    }

    // Create all tickets in a transaction
    await prisma.$transaction(
      ticketsToCreate.map(ticket =>
        prisma.ticket.create({ data: ticket })
      )
    )

    // Check the current count
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { tickets: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully added 19 test tickets',
      ticketsSold: event?.tickets.length,
      maxCapacity: event?.maxCapacity,
      spotsRemaining: (event?.maxCapacity || 0) - (event?.tickets.length || 0),
    })
  } catch (error) {
    console.error('Error adding test tickets:', error)
    return NextResponse.json(
      { error: 'Failed to add test tickets', details: String(error) },
      { status: 500 }
    )
  }
}
