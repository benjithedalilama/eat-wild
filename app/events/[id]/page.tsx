'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string
  date: string
  location: string
  price: number
  maxCapacity: number
  ticketsSold: number
  ticketsAvailable: number
}

export default function EventPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error('Event not found')
        }
        const data = await response.json()
        setEvent(data)
      } catch (err) {
        setError('Failed to load event')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError((err as Error).message)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', padding: '60px 20px 40px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ fontSize: '16px', fontWeight: 300, color: '#333' }}>loading...</p>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
          <p style={{ fontSize: '16px', fontWeight: 300, color: '#333', marginBottom: '20px' }}>{error}</p>
          <Link href="/" style={{ color: '#000', textDecoration: 'underline' }}>
            back to home
          </Link>
        </div>
      </div>
    )
  }

  if (!event) return null

  const isSoldOut = event.ticketsAvailable <= 0

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px 40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', color: '#000', textDecoration: 'none' }}>
          <Image src="/favicon.svg" alt="Eat Wild" width={24} height={24} style={{ marginRight: '12px' }} />
          <span style={{ fontSize: '20px', fontWeight: 300 }}>eat wild</span>
        </Link>

        <Link href="/" style={{
          display: 'inline-block',
          fontSize: '14px',
          fontWeight: 300,
          color: '#666',
          textDecoration: 'none',
          marginBottom: '24px',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.5'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
          ← back
        </Link>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>{event.title}</h1>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '8px', color: '#333' }}>
              {event.description}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '8px', color: '#333' }}>
              <strong>when:</strong> {event.date}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '8px', color: '#333' }}>
              <strong>where:</strong> {event.location}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '8px', color: '#333' }}>
              <strong>price:</strong> ${event.price} per person
            </p>
            <p style={{ fontSize: '16px', fontWeight: 300, marginBottom: '8px', color: '#333' }}>
              <strong>availability:</strong> {event.ticketsAvailable} of {event.maxCapacity} spots remaining
            </p>
            {isSoldOut && (
              <p style={{ fontSize: '16px', fontWeight: 400, color: '#d00', marginBottom: '8px' }}>
                sold out
              </p>
            )}
          </div>
        </div>

        {!isSoldOut && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 400, marginBottom: '16px' }}>book your spot</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="name" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 400,
                  marginBottom: '8px'
                }}>
                  name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 300,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                    backgroundColor: '#fff',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 400,
                  marginBottom: '8px'
                }}>
                  email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 300,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                    backgroundColor: '#fff',
                  }}
                />
              </div>

              {error && (
                <p style={{
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#d00',
                  marginBottom: '16px'
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#fff',
                  backgroundColor: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                }}
              >
                {isSubmitting ? 'processing...' : `book for $${event.price}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
