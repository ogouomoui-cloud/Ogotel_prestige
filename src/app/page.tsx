'use client'

import Navbar from '@/components/hotel/Navbar'
import Hero from '@/components/hotel/Hero'
import About from '@/components/hotel/About'
import Rooms from '@/components/hotel/Rooms'
import Amenities from '@/components/hotel/Amenities'
import Dining from '@/components/hotel/Dining'
import Gallery from '@/components/hotel/Gallery'
import Testimonials from '@/components/hotel/Testimonials'
import Contact from '@/components/hotel/Contact'
import Footer from '@/components/hotel/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Rooms />
        <Amenities />
        <Dining />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
