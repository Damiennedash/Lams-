'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) return

    setLoading(true)
    try {
      const res = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (res?.ok) {
        toast.success('Connexion réussie !')
        // Redirect based on role
        const session = await getSession()
        const role = (session?.user as any)?.role
        if (role === 'ADMIN') {
          router.push('/admin')
        } else if (role === 'LIVREUR') {
          router.push('/livreur')
        } else {
          router.push('/')
        }
        router.refresh()
      } else {
        toast.error('Identifiant ou mot de passe incorrect')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lams-cream flex">
      {/* Left - Image */}
      <div className="hidden lg:block relative w-1/2">
        <Image src="/LAMS.jpg" alt="LAMS" fill className="object-cover" />
        <div className="absolute inset-0 bg-lams-dark/60 flex flex-col items-center justify-center">
          <h1 className="font-serif text-6xl text-lams-cream tracking-[0.3em] font-light">LAMS</h1>
          <p className="text-lams-gold text-[11px] tracking-[0.4em] mt-2">BOUTIQUE</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link href="/">
              <h1 className="font-serif text-4xl text-lams-dark tracking-[0.3em] font-light">LAMS</h1>
              <p className="text-lams-gold text-[10px] tracking-[0.4em] mt-1">BOUTIQUE</p>
            </Link>
          </div>

          <h2 className="text-2xl font-serif text-lams-dark mb-1">Connexion</h2>
          <p className="text-sm text-lams-gray mb-8">
            Utilisez votre email, votre ID unique ou votre mot de passe
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">
                EMAIL OU ID UNIQUE
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ex: user@email.com ou LMS-XXXXXXXX"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">
                MOT DE PASSE
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lams-gray hover:text-lams-dark"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                  SE CONNECTER
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-lams-border text-center space-y-3">
            <p className="text-sm text-lams-gray">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-lams-dark font-medium hover:text-lams-brown transition-colors">
                S'inscrire
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
