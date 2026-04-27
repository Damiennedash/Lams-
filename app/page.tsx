import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EventPopup from '@/components/shop/EventPopup'
import HomeClient from '@/components/shop/HomeClient'

function HomeLoading() {
  return (
    <div className="min-h-screen bg-lams-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />
      <EventPopup />
      <main className="min-h-screen bg-lams-cream">
        <Suspense fallback={<HomeLoading />}>
          <HomeClient />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
