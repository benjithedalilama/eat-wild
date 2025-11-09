import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Fetch all events with ticket availability
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        tickets: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const eventsWithAvailability = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      price: event.price,
      maxCapacity: event.maxCapacity,
      ticketsSold: event.tickets.length,
      ticketsAvailable: event.maxCapacity - event.tickets.length,
    }))

    return NextResponse.json(eventsWithAvailability, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
