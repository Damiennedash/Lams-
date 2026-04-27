'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, User, Loader, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Livreur {
  id: string; uniqueId: string; name: string; phone: string; email: string; createdAt: string
}

export default function AdminLivreursPage() {
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastCreated, setLastCreated] = useState<{ uniqueId: string; name: string; password: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/livreurs')
      const data = await res.json()
      if (data.livreurs) setLivreurs(data.livreurs)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      toast.error('Tous les champs sont requis')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), password }),
      })
      const data = await res.json()
      if (data.user) {
        setLivreurs(prev => [...prev, data.user])
        setLastCreated({ uniqueId: data.user.uniqueId, name: data.user.name, password })
        setName(''); setPhone(''); setPassword('')
        setShowForm(false)
        toast.success('Compte livreur créé')
      } else {
        toast.error(data.error ?? 'Erreur création compte')
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Désactiver le compte de ${name} ?`)) return
    const res = await fetch('/api/admin/livreurs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setLivreurs(prev => prev.filter(l => l.id !== id))
      toast.success('Compte désactivé')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-lams-dark">Gestion des Livreurs</h1>
          <p className="text-lams-gray text-sm mt-1">{livreurs.length} livreur(s) actif(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-dark flex items-center gap-2">
          <Plus size={16} /> NOUVEAU LIVREUR
        </button>
      </div>

      {/* Last created credentials banner */}
      {lastCreated && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800 mb-2">✅ Compte créé — Identifiants à transmettre au livreur</p>
              <div className="space-y-1 font-mono text-sm">
                <p><span className="text-lams-gray">Nom :</span> <strong>{lastCreated.name}</strong></p>
                <p><span className="text-lams-gray">Code ID :</span> <strong className="text-lams-dark text-base">{lastCreated.uniqueId}</strong></p>
                <p><span className="text-lams-gray">Mot de passe :</span> <strong>{lastCreated.password}</strong></p>
                <p className="text-[11px] text-lams-gray mt-2">Le livreur se connecte sur <strong>/livreur</strong> avec son Code ID et son mot de passe.</p>
              </div>
            </div>
            <button onClick={() => setLastCreated(null)}><X size={16} className="text-lams-gray" /></button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
        </div>
      ) : livreurs.length === 0 ? (
        <div className="bg-white text-center py-16">
          <User size={48} className="text-lams-border mx-auto mb-4" />
          <p className="text-lams-gray">Aucun livreur. Créez le premier compte.</p>
        </div>
      ) : (
        <div className="bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lams-border">
                <th className="text-left text-[10px] tracking-widest text-lams-gray px-5 py-3">LIVREUR</th>
                <th className="text-left text-[10px] tracking-widest text-lams-gray px-5 py-3">CODE ID</th>
                <th className="text-left text-[10px] tracking-widest text-lams-gray px-5 py-3 hidden sm:table-cell">TÉLÉPHONE</th>
                <th className="text-left text-[10px] tracking-widest text-lams-gray px-5 py-3 hidden sm:table-cell">CRÉÉ LE</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-lams-border/50">
              {livreurs.map(l => (
                <tr key={l.id} className="hover:bg-lams-cream/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-lams-gold/15 rounded-full flex items-center justify-center">
                        <User size={16} className="text-lams-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-lams-dark text-sm">{l.name}</p>
                        <p className="text-[11px] text-lams-gray">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-lams-dark text-sm bg-lams-cream px-2 py-1">{l.uniqueId}</span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell text-sm text-lams-gray">{l.phone}</td>
                  <td className="px-5 py-4 hidden sm:table-cell text-sm text-lams-gray">{formatDate(l.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => remove(l.id, l.name)}
                      className="text-lams-gray hover:text-red-500 transition-colors"
                      title="Désactiver"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-lams-border">
              <p className="font-semibold text-lams-dark">Nouveau compte livreur</p>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-lams-gray" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOM COMPLET *</label>
                <input className="input-field" placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">TÉLÉPHONE *</label>
                <input className="input-field" placeholder="+228 XX XX XX XX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">MOT DE PASSE *</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Mot de passe temporaire"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lams-gray">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-lams-gray mt-1">Un code ID unique (LIV-XXXXXXXX) sera généré automatiquement.</p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">ANNULER</button>
              <button onClick={create} disabled={saving} className="btn-dark flex-1 disabled:opacity-50">
                {saving ? <Loader size={15} className="animate-spin mx-auto" /> : 'CRÉER LE COMPTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
