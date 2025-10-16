'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string
  date: string
  location: string
  price: number
  ticketsAvailable: number
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events', {
          cache: 'no-store',
        })
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Refetch when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents()
      }
    }

    const handleFocus = () => {
      fetchEvents()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.site-header') as HTMLElement
      if (!header) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (window.innerWidth <= 768) {
        const translateY = Math.min(scrollTop, 60)
        header.style.transform = `translateY(-${translateY}px)`
      } else {
        header.style.transform = 'translateY(0)'
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <>
      <header className="site-header">
        <Image src="/favicon.svg" alt="Eat Wild Logo" width={24} height={24} className="logo" />
        <h1 className="site-title">eat wild</h1>
      </header>

      <nav className="side-nav">
        <ul>
          <li><a href="#experiences">experiences</a></li>
          <li><a href="#research">research</a></li>
          <li><a href="#products">products</a></li>
          <li><a href="#about">about</a></li>
          <li><a href="#contact">work with us</a></li>
        </ul>
      </nav>

      <main className="content">
        <section id="experiences">
          <h1>experiences</h1>
          {loading ? (
            <p>loading...</p>
          ) : events.length === 0 ? (
            <p>no upcoming experiences at the moment</p>
          ) : (
            events.map(event => {
              const isSoldOut = event.ticketsAvailable <= 0
              return (
                <p key={event.id}>
                  {event.title.toLowerCase()}: {event.description.toLowerCase()} - {event.date.toLowerCase()}, ${event.price} pp
                  {isSoldOut && <span style={{ color: '#d00' }}> (sold out)</span>}
                  , <Link href={`/events/${event.id}`}>{isSoldOut ? 'learn more' : 'book'}</Link>
                </p>
              )
            })
          )}
        </section>

        <section id="research">
          <h1>research</h1>
          <p>in progress - investigating sea urchin RAS (Recirculating Aquaculture System) ranching in urban
            environments</p>
          <p>coming soon - investigating underwater ROV (drone) sea urchin population management</p>
        </section>

        <section id="products">
          <h1>products</h1>
          <p>coming soon</p>
        </section>

        <section id="about">
          <h1>about</h1>
          <p>We were founded on principles of sustainability and respect for wild spaces and the people who care for
            them</p>
          <p>We believe fostering meaningful connections between people and nature push people to realize how much
            they need earth</p>
          <p>Ben Imadali - born in Boston, raised in Phoenix as a desert kid, fell in love with Northern California
            land, ocean, and people</p>
          <p>Ellen Scott-Young - born in Gold Coast, Australia, grew up on a tidal river with a deep love for the
            ocean</p>
        </section>

        <section id="contact">
          <h1>work with us</h1>
          <p>interested in partnering on sustainability initiatives, ocean conservation, or wild food experiences? <a
              href="mailto:ben.imadali@gmail.com">reach out</a></p>
        </section>
      </main>
    </>
  )
}
