import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { profileAdapter } from '@infrastructure/supabase/profile.adapter'
import { storageAdapter } from '@infrastructure/supabase/storage.adapter'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/TextInput'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { PLAYER_POSITIONS, PLAYER_POSITION_LABELS, type PlayerPosition } from '@domain/profile'
import { Camera, Save } from 'lucide-react'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  position: z.enum(['arquero', 'defensa', 'mediocampista', 'delantero']).nullable(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      position: (profile?.position as PlayerPosition) ?? null,
    },
    values: {
      name: profile?.name ?? '',
      position: (profile?.position as PlayerPosition) ?? null,
    },
  })

  const currentPosition = watch('position')

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg('La foto no puede superar los 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo debe ser una imagen')
      return
    }

    setUploading(true)
    setErrorMsg('')

    try {
      const path = `${profile.id}/photo.jpg`
      await storageAdapter.upload('avatars', path, file)
      const photoUrl = storageAdapter.getPublicUrl('avatars', path)
      await profileAdapter.update(profile.id, { photo_url: photoUrl })
      await refreshProfile()
      setSuccessMsg('Foto actualizada')
    } catch {
      setErrorMsg('Error al subir la foto. Intentá de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) return

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await profileAdapter.update(profile.id, {
        name: data.name,
        position: data.position,
      })
      await refreshProfile()
      setSuccessMsg('Perfil guardado correctamente')
    } catch {
      setErrorMsg('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-3.5rem)] bg-gris-bg dark:bg-dark-bg py-8 px-4 transition-colors duration-200">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Mi Perfil</h1>

          <Card className="space-y-6">
            {/* Photo section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar
                src={profile?.photo_url}
                name={profile?.name ?? 'Usuario'}
                size="lg"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Cambiar foto
              </Button>
              <p className="text-xs text-gray-400">Máximo 2MB. Formatos JPG, PNG.</p>
            </div>

            <hr className="border-gris-border dark:border-dark-border" />

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <TextInput
                label="Nombre completo"
                placeholder="Tu nombre"
                error={errors.name?.message}
                {...register('name')}
              />

              {/* Position selector */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                  Posición de juego
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]
                      ${currentPosition === null
                        ? 'border-verde-primary bg-verde-primary/10 text-verde-primary'
                        : 'border-gris-border dark:border-dark-border text-gray-600 dark:text-dark-text-muted hover:border-gray-400 dark:hover:border-dark-text'
                      }`}
                    onClick={() => setValue('position', null)}
                  >
                    Sin especificar
                  </button>
                  {PLAYER_POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]
                        ${currentPosition === pos
                          ? 'border-verde-primary bg-verde-primary/10 text-verde-primary'
                          : 'border-gris-border text-gray-600 hover:border-gray-400'
                        }`}
                      onClick={() => setValue('position', pos)}
                    >
                      {PLAYER_POSITION_LABELS[pos]}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 border border-rojo-alert/20 p-3 text-sm text-rojo-alert">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-lg bg-green-50 border border-verde-primary/20 p-3 text-sm text-verde-primary">
                  {successMsg}
                </div>
              )}

              <Button type="submit" className="w-full" loading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
