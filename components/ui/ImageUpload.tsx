'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export default function ImageUpload({ value, onChange, label = 'IMAGE', className = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const upload = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast.error('Format non supporté. JPG, PNG, WebP ou GIF uniquement.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop lourd (max 10 Mo)')
      return
    }

    setUploading(true)
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'lams_unsigned'

      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', uploadPreset)
      fd.append('folder', 'lams-boutique')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()

      if (res.ok && data.secure_url) {
        onChange(data.secure_url)
        toast.success('Image uploadée !')
      } else {
        toast.error(data.error?.message || "Erreur d'upload")
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  return (
    <div className={className}>
      {label && (
        <label className="text-[11px] tracking-widest text-lams-gray block mb-1.5">{label}</label>
      )}

      {/* Preview or upload zone */}
      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Aperçu"
            className="w-full h-48 object-cover border border-lams-border"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-lams-dark px-3 py-1.5 text-xs font-medium hover:bg-lams-cream transition-colors flex items-center gap-1.5"
            >
              <Upload size={12} />
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500 text-white px-3 py-1.5 text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
            >
              <X size={12} />
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center h-40 ${
            dragOver
              ? 'border-lams-dark bg-lams-cream/60'
              : 'border-lams-border hover:border-lams-dark hover:bg-lams-cream/30'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader size={24} className="text-lams-dark animate-spin" />
              <p className="text-xs text-lams-gray">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <div className="w-10 h-10 bg-lams-cream rounded-full flex items-center justify-center">
                <ImageIcon size={20} className="text-lams-gray" />
              </div>
              <p className="text-sm text-lams-dark font-medium">Glissez une image ici</p>
              <p className="text-[11px] text-lams-gray">ou cliquez pour choisir un fichier</p>
              <p className="text-[10px] text-lams-lightgray mt-1">JPG, PNG, WebP · Max 10 Mo</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
