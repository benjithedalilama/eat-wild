import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTickets() {
  const eventId = 'sf-sunset-mussels-2024'

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tickets: true },
  })

  if (event) {
    console.log('Event:', event.title)
    console.log('Max Capacity:', event.maxCapacity)
    console.log('Tickets Sold:', event.tickets.length)
    console.log('Tickets Available:', event.maxCapacity - event.tickets.length)
    console.log('\nTicket IDs:')
    event.tickets.forEach(ticket => {
      console.log(`  - ${ticket.id}: ${ticket.customerName} (${ticket.customerEmail})`)
    })
  } else {
    console.log('Event not found')
  }
}

checkTickets()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
