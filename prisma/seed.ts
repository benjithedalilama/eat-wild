import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create the SF Sunset Mussels event
  const event = await prisma.event.upsert({
    where: { id: 'sf-sunset-mussels-2024' },
    update: {},
    create: {
      id: 'sf-sunset-mussels-2024',
      title: 'SF Sunset Mussels Catch and Cook',
      description: 'Fine wine, fresh baguettes, and moules marinières oceanside with a sunset view',
      date: 'Sunday 11/2 @ 1pm',
      location: 'San Francisco Coast',
      price: 200,
      maxCapacity: 20, // Changed from 14 to 20 as per user request
    },
  })

  console.log('Seeded event:', event)

  // Create 10 test tickets for the event
  console.log('Creating 10 test tickets...')
  for (let i = 1; i <= 10; i++) {
    await prisma.ticket.create({
      data: {
        eventId: event.id,
        customerName: `Test Customer ${i}`,
        customerEmail: `test${i}@example.com`,
        stripeSessionId: `test_session_${event.id}_${i}_${Date.now()}`,
      },
    })
  }

  console.log('Created 10 test tickets')
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
