'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { Event } from '@/types'
import ImageUpload from '@/components/ui/ImageUpload'

const emptyForm = {
  title: '', content: '', image: '', ctaText: '', ctaLink: '',
  active: true, startDate: '', endDate: '',
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (event: Event) => {
    setEditId(event.id)
    setForm({
      title: event.title,
      content: event.content,
      image: event.image || '',
      ctaText: event.ctaText || '',
      ctaLink: event.ctaLink || '',
      active: event.active,
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Titre et contenu requis'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...form }),
      })
      if (res.ok) {
        toast.success(editId ? 'Événement mis à jour' : 'Événement créé')
        setShowForm(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (event: Event) => {
    await fetch('/api/admin/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, active: !event.active }),
    })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await fetch('/api/admin/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Événement supprimé')
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-lams-dark">Événements & Popups</h1>
          <p className="text-lams-gray text-sm mt-1">Gérez les popups affichées aux visiteurs</p>
        </div>
        <button onClick={openNew} className="btn-dark flex items-center gap-2">
          <Plus size={16} />
          CRÉER UN ÉVÉNEMENT
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-white text-center py-16">
              <p className="text-lams-gray mb-4">Aucun événement créé</p>
              <button onClick={openNew} className="btn-outline">CRÉER VOTRE PREMIER ÉVÉNEMENT</button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={`bg-white border-l-4 ${event.active ? 'border-lams-gold' : 'border-lams-border'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-lams-dark">{event.title}</h3>
                      <span className={`text-[10px] tracking-widest px-2 py-0.5 ${event.active ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                        {event.active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </div>
                    <p className="text-sm text-lams-gray line-clamp-2">{event.content}</p>
                    <div className="flex gap-4 mt-2 text-[11px] text-lams-gray">
                      <span>Créé le {formatDate(event.createdAt)}</span>
                      {event.ctaText && <span>CTA: {event.ctaText}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(event)}
                      className="p-2 text-lams-gray hover:text-lams-dark transition-colors"
                      title={event.active ? 'Désactiver' : 'Activer'}
                    >
                      {event.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => openEdit(event)}
                      className="p-2 text-lams-gray hover:text-lams-dark transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-lams-gray hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lams-dark/50">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-lams-border">
              <h2 className="font-serif text-xl text-lams-dark">
                {editId ? 'Modifier' : 'Nouvel événement'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-lams-gray hover:text-lams-dark">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">TITRE *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  placeholder="Titre du popup"
                />
              </div>
              <div>
                <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">CONTENU *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Message de l'événement..."
                />
              </div>
              <ImageUpload
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                label="IMAGE DU POPUP"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">TEXTE DU BOUTON</label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className="input-field"
                    placeholder="Découvrir"
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">LIEN DU BOUTON</label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    className="input-field"
                    placeholder="/boutique"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">DATE DE DÉBUT</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">DATE DE FIN</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-lams-dark"
                />
                <span className="text-sm text-lams-gray">Activer immédiatement</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-lams-border flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-dark flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-lams-cream/30 border-t-lams-cream rounded-full animate-spin" /> : <Save size={15} />}
                {editId ? 'METTRE À JOUR' : 'CRÉER'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline">ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
