import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create the SF Sunset Mussels event
  const event = await prisma.event.upsert({
    where: { id: 'sf-sunset-mussels-2024' },
    update: {
      description: 'learn to forage and cook moules marinières oceanside with fine wine, fresh baguettes, and a sunset view. includes a quick moderate hike on uneven terrain and requires a day fishing license if collecting mussels',
      additionalDetails: `
**Meeting Location**
Marshall's Beach parking lot
https://maps.google.com/?q=37.803222,-122.476917
GPS Coordinates: 37°48'11.6"N 122°28'36.9"W

**Fishing License Required**
All participants must have a valid California one-day fishing license. You are legally responsible for obtaining your license before the event. Fines for fishing without a license can be significant.

Purchase your license online at: https://wildlife.ca.gov/Licensing/Online-Sales
- Choose "One-Day Sport Fishing License"
- Bring a digital or printed copy to the event

**What's Included**
We provide everything you need for the experience:
- Foraging gloves and tools
- Complete cooking setup
- Wine and fresh baguettes
- All cooking ingredients for moules marinières

**What to Bring**
- Your fishing license (required)
- Comfortable hiking shoes
- Layers for weather changes
- Water bottle
- If you want to take extra mussels home: bring your own container or cooler (note: there's a hike involved)

**The Hike**
Marshall's Beach requires a moderate hike down from the parking area:
- Distance: Approximately 0.3 miles (0.5 km) each way
- Elevation change: ~200 feet descent (and ascent on return)
- Terrain: Steep, sandy trail with uneven footing
- Duration: 10-15 minutes down, 15-20 minutes back up
- Difficulty: Moderate
      `.trim(),
    },
    create: {
      id: 'sf-sunset-mussels-2024',
      title: 'SF Sunset Mussels Catch and Cook',
      description: 'learn to forage and cook moules marinières oceanside with fine wine, fresh baguettes, and a sunset view. includes a quick moderate hike on uneven terrain and requires a day fishing license if collecting mussels',
      date: 'Sunday 11/2 @ 1pm',
      location: 'San Francisco Coast',
      price: 200,
      maxCapacity: 20,
      additionalDetails: `
**Meeting Location**
Marshall's Beach parking lot
https://maps.google.com/?q=37.803222,-122.476917
GPS Coordinates: 37°48'11.6"N 122°28'36.9"W

**Fishing License Required**
All participants must have a valid California one-day fishing license. You are legally responsible for obtaining your license before the event. Fines for fishing without a license can be significant.

Purchase your license online at: https://wildlife.ca.gov/Licensing/Online-Sales
- Choose "One-Day Sport Fishing License"
- Bring a digital or printed copy to the event

**What's Included**
We provide everything you need for the experience:
- Foraging gloves and tools
- Complete cooking setup
- Wine and fresh baguettes
- All cooking ingredients for moules marinières

**What to Bring**
- Your fishing license (required)
- Comfortable hiking shoes
- Layers for weather changes
- Water bottle
- If you want to take extra mussels home: bring your own container or cooler (note: there's a hike involved)

**The Hike**
Marshall's Beach requires a moderate hike down from the parking area:
- Distance: Approximately 0.3 miles (0.5 km) each way
- Elevation change: ~200 feet descent (and ascent on return)
- Terrain: Steep, sandy trail with uneven footing
- Duration: 10-15 minutes down, 15-20 minutes back up
- Difficulty: Moderate
      `.trim(),
    },
  })

  console.log('Seeded event:', event)

  // Create 10 test tickets only if none exist
  const existingTickets = await prisma.ticket.count({
    where: { eventId: event.id }
  })

  if (existingTickets === 0) {
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
  } else {
    console.log(`Skipping test tickets - ${existingTickets} tickets already exist`)
  }
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
