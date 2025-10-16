'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  useEffect(() => {
    let isScrolling = false
    const header = document.querySelector('.site-header') as HTMLElement
    const navLinks = document.querySelectorAll('.side-nav a')

    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      if (window.innerWidth <= 768) {
        const maxScroll = 60
        const translateY = Math.min(scrollTop, maxScroll)
        if (header) {
          header.style.transform = `translateY(-${translateY}px)`
        }
      } else {
        if (header) {
          header.style.transform = 'translateY(0)'
        }
      }
    }

    const scrollHandler = () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          handleScroll()
          isScrolling = false
        })
        isScrolling = true
      }
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          const targetId = link.getAttribute('href')
          const targetElement = targetId ? document.querySelector(targetId) : null

          if (targetElement && targetId?.startsWith('#')) {
            e.preventDefault()

            if (header) {
              header.style.transform = 'translateY(-60px)'
            }

            const targetPosition = (targetElement as HTMLElement).offsetTop - 20
            window.scrollTo({
              top: targetPosition,
              behavior: 'auto'
            })
          }
        }
      })
    })

    const resizeHandler = () => {
      if (window.innerWidth > 768 && header) {
        header.style.transform = 'translateY(0)'
      }
    }

    window.addEventListener('resize', resizeHandler)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', resizeHandler)
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
          <p>sf sunset mussels catch and cook: fine wine, fresh baguettes, and moules marinières oceanside with
            a sunset view - sunday 11/2 @ 1pm, $200 pp, <Link href="/events/sf-sunset-mussels-2024">book</Link></p>
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
