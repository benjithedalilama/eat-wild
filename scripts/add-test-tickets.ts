import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTestTickets() {
  const eventId = 'sf-sunset-mussels-2024'

  // Create 20 test tickets
  for (let i = 1; i <= 20; i++) {
    await prisma.ticket.create({
      data: {
        eventId,
        customerName: `Test Customer ${i}`,
        customerEmail: `test${i}@example.com`,
        stripeSessionId: `test_session_${Date.now()}_${i}`,
      },
    })
  }

  console.log('Successfully added 20 test tickets')

  // Check the current count
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tickets: true },
  })

  console.log(`Event now has ${event?.tickets.length} tickets sold out of ${event?.maxCapacity} capacity`)
}

addTestTickets()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
