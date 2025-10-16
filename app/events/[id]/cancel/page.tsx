'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function CancelPage() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px 40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', marginBottom: '60px', color: '#000', textDecoration: 'none' }}>
          <Image src="/favicon.svg" alt="Eat Wild" width={24} height={24} style={{ marginRight: '12px' }} />
          <span style={{ fontSize: '20px', fontWeight: 300 }}>eat wild</span>
        </Link>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 400, marginBottom: '20px' }}>booking cancelled</h1>

          <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '12px', color: '#333' }}>
            no worries, your payment was not processed
          </p>

          <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '40px', color: '#333' }}>
            you can try booking again whenever you're ready
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/events/${eventId}`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 400,
                color: '#fff',
                backgroundColor: '#000',
                border: '1px solid #000',
                borderRadius: '4px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              try again
            </Link>

            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 400,
                color: '#000',
                backgroundColor: 'transparent',
                border: '1px solid #000',
                borderRadius: '4px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
