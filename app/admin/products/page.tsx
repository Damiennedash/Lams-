'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Package, Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product } from '@/types'
import { formatPrice, getCategoryLabel, parseImages, parseArray } from '@/lib/utils'
import ImageUpload from '@/components/ui/ImageUpload'

const emptyForm = {
  name: '', description: '', price: '', category: 'VINTAGE' as Product['category'],
  images: [] as string[], colors: '', sizes: '', stock: '', featured: false, active: true,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?limit=100&active=all')
      const data = await res.json()
      // Load all including inactive - we need admin API
      const adminRes = await fetch('/api/products?limit=200')
      const adminData = await adminRes.json()
      setProducts(adminData.products || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      images: parseImages(product.images as unknown as string),
      colors: parseArray(product.colors as unknown as string).join(', '),
      sizes: parseArray(product.sizes as unknown as string).join(', '),
      stock: String(product.stock),
      featured: product.featured,
      active: product.active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) {
      toast.error('Remplissez les champs obligatoires')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        category: form.category,
        images: form.images,
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        stock: form.stock,
        featured: form.featured,
        active: form.active,
      }

      const res = await fetch(
        editing ? `/api/products/${editing.id}` : '/api/products',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (res.ok) {
        toast.success(editing ? 'Produit mis à jour' : 'Produit créé')
        setShowForm(false)
        load()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce produit ?')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Produit désactivé')
      load()
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-lams-dark">Produits</h1>
          <p className="text-lams-gray text-sm mt-1">{products.length} produit(s)</p>
        </div>
        <button onClick={openNew} className="btn-dark flex items-center gap-2">
          <Plus size={16} />
          AJOUTER
        </button>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-lams-dark/20 border-t-lams-dark rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lams-border bg-lams-cream/40">
                {['PRODUIT', 'CATÉGORIE', 'PRIX', 'STOCK', 'VENDUS', 'STATUT', 'ACTIONS'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] tracking-widest text-lams-gray font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-lams-border">
              {products.map((product) => {
                const images = parseImages(product.images as unknown as string)
                return (
                  <tr key={product.id} className={`hover:bg-lams-cream/20 transition-colors ${!product.active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-lams-cream flex-shrink-0 relative overflow-hidden">
                          {images[0] ? (
                            <Image src={images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-lams-lightgray" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-lams-dark">{product.name}</p>
                          {product.featured && (
                            <span className="text-[10px] text-lams-gold">★ Vedette</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-lams-gray">{getCategoryLabel(product.category)}</td>
                    <td className="px-5 py-4 text-sm font-medium text-lams-dark">{formatPrice(product.price)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-lams-gray">{product.sold}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] tracking-widest px-2 py-0.5 ${product.active ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                        {product.active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-lams-gray hover:text-lams-dark transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-lams-gray hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-center text-lams-gray py-12 text-sm">Aucun produit. Cliquez sur "AJOUTER" pour commencer.</p>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lams-dark/50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-lams-border">
              <h2 className="font-serif text-xl text-lams-dark">
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-lams-gray hover:text-lams-dark">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">NOM *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Nom du produit"
                  />
                </div>

                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">PRIX (FCFA) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">STOCK *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="input-field"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">CATÉGORIE</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="VINTAGE">Vintage</option>
                    <option value="STOCKS">Stocks</option>
                    <option value="LAMS_COLLECTION">Collection LAMS</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">DESCRIPTION</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Description du produit..."
                  />
                </div>

                {/* Multi-image upload */}
                <div className="col-span-2">
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-2">
                    IMAGES DU PRODUIT
                    <span className="text-lams-lightgray ml-1 normal-case font-normal">(jusqu'à 4 photos)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <ImageUpload
                        key={idx}
                        value={form.images[idx] || ''}
                        onChange={(url) => {
                          const next = [...form.images]
                          if (url) { next[idx] = url } else { next.splice(idx, 1) }
                          setForm({ ...form, images: next.filter(Boolean) })
                        }}
                        label={idx === 0 ? 'PHOTO PRINCIPALE' : `PHOTO ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">
                    COULEURS (séparées par virgule)
                  </label>
                  <input
                    type="text"
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    className="input-field"
                    placeholder="#FF0000, #0000FF, noir"
                  />
                </div>

                <div>
                  <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">
                    TAILLES (séparées par virgule)
                  </label>
                  <input
                    type="text"
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    className="input-field"
                    placeholder="XS, S, M, L, XL"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="w-4 h-4 accent-lams-dark"
                    />
                    <span className="text-sm text-lams-gray">Produit vedette</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="w-4 h-4 accent-lams-dark"
                    />
                    <span className="text-sm text-lams-gray">Actif</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-lams-border flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-dark flex items-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-lams-cream/30 border-t-lams-cream rounded-full animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {editing ? 'METTRE À JOUR' : 'CRÉER'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-outline">
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
