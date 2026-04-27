'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Save, Copy, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        address: '',
      })
    }
  }, [session, status, router])

  const copyId = () => {
    navigator.clipboard.writeText((session?.user as any)?.uniqueId || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('ID copié !')
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-lams-cream">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-serif text-3xl text-lams-dark mb-8">Mon Profil</h1>

          {/* ID */}
          <div className="bg-lams-dark p-6 mb-8">
            <p className="text-[10px] tracking-[0.3em] text-lams-gray mb-2">VOTRE ID UNIQUE</p>
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xl text-lams-gold tracking-[0.2em] font-bold">
                {(session?.user as any)?.uniqueId || '—'}
              </p>
              <button onClick={copyId} className="text-lams-lightgray hover:text-lams-cream transition-colors flex items-center gap-1.5 text-[11px] tracking-wider">
                {copied ? <CheckCheck size={14} className="text-lams-gold" /> : <Copy size={14} />}
                {copied ? 'COPIÉ' : 'COPIER'}
              </button>
            </div>
            <p className="text-[11px] text-lams-gray mt-3">
              Utilisez cet ID pour vous connecter sans email.
            </p>
          </div>

          <div className="bg-white p-6 space-y-4">
            <h2 className="text-[11px] tracking-[0.25em] text-lams-gray mb-2">INFORMATIONS</h2>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOM</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">EMAIL</label>
              <input
                type="email"
                value={form.email}
                className="input-field bg-lams-cream/30 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">TÉLÉPHONE</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="+229 XX XX XX XX"
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widests text-lams-gray block mb-1.5">ADRESSE DE LIVRAISON</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="input-field resize-none"
                placeholder="Votre adresse principale"
              />
            </div>

            <button
              onClick={() => toast.success('Profil mis à jour')}
              className="btn-dark flex items-center gap-2"
            >
              <Save size={15} />
              ENREGISTRER
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
