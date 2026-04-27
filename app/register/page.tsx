'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ uniqueId: string } | null>(null)

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit comporter au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone }),
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess({ uniqueId: data.uniqueId })
      } else {
        toast.error(data.error || "Erreur lors de l'inscription")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-lams-cream flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-lams-dark rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-lams-gold" />
          </div>
          <h2 className="font-serif text-3xl text-lams-dark mb-3">Bienvenue !</h2>
          <p className="text-lams-gray text-sm mb-6">
            Votre compte a été créé avec succès. Votre ID unique vous a été envoyé par email.
          </p>
          <div className="bg-lams-dark p-6 mb-6">
            <p className="text-[10px] tracking-[0.3em] text-lams-gray mb-2">VOTRE ID UNIQUE</p>
            <p className="font-mono text-xl text-lams-gold tracking-[0.2em] font-bold">{success.uniqueId}</p>
            <p className="text-[11px] text-lams-lightgray mt-3">
              Conservez cet ID. Il vous permet de vous connecter.
            </p>
          </div>
          <Link href="/login" className="btn-dark w-full block text-center">
            SE CONNECTER
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lams-cream flex">
      {/* Left */}
      <div className="hidden lg:block relative w-1/2">
        <Image src="/LAMS.jpg" alt="LAMS" fill className="object-cover" />
        <div className="absolute inset-0 bg-lams-dark/60 flex flex-col items-center justify-center">
          <h1 className="font-serif text-6xl text-lams-cream tracking-[0.3em] font-light">LAMS</h1>
          <p className="text-lams-gold text-[11px] tracking-[0.4em] mt-2">BOUTIQUE</p>
        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <h1 className="font-serif text-4xl text-lams-dark tracking-[0.3em] font-light">LAMS</h1>
            </Link>
          </div>

          <h2 className="text-2xl font-serif text-lams-dark mb-1">Créer un compte</h2>
          <p className="text-sm text-lams-gray mb-8">
            Rejoignez LAMS et recevez votre ID unique par email
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOM COMPLET *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Votre nom"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">EMAIL *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="votre@email.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">TÉLÉPHONE</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+229 XX XX XX XX"
                className="input-field"
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">MOT DE PASSE *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="8 caractères minimum"
                  className="input-field pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lams-gray"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">CONFIRMER *</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                placeholder="Répétez votre mot de passe"
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-dark w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-lams-cream/30 border-t-lams-cream rounded-full animate-spin" />
              ) : (
                <>
                  CRÉER MON COMPTE
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-lams-border text-center space-y-3">
            <p className="text-sm text-lams-gray">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-lams-dark font-medium hover:text-lams-brown">
                Se connecter
              </Link>
            </p>
            <Link href="/" className="text-[11px] tracking-widest text-lams-gray hover:text-lams-dark transition-colors block">
              ← RETOUR À LA BOUTIQUE
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
