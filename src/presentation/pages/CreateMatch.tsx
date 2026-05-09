import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateMatch } from '../hooks/useMatches'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextInput } from '../components/ui/TextInput'
import { ArrowLeft, Calendar, Clock, AlignLeft } from 'lucide-react'

const createMatchSchema = z.object({
  date: z
    .string()
    .min(1, 'La fecha es obligatoria'),
  start_time: z
    .string()
    .min(1, 'La hora de inicio es obligatoria'),
  end_time: z
    .string()
    .min(1, 'La hora de fin es obligatoria'),
  location: z
    .string()
    .min(2, 'La zona debe tener al menos 2 caracteres')
    .max(100, 'La zona no puede superar 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional(),
  slots: z
    .number({ invalid_type_error: 'Los cupos son obligatorios' })
    .int('Los cupos deben ser un número entero')
    .min(2, 'Mínimo 2 cupos')
    .max(30, 'Máximo 30 cupos'),
  whatsapp_link: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
})

type CreateMatchForm = z.infer<typeof createMatchSchema>

export function CreateMatchPage() {
  const navigate = useNavigate()
  const { createMatch, loading, error: submitError } = useCreateMatch()
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMatchForm>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      description: '',
      slots: 14,
      whatsapp_link: '',
    },
  })

  const onSubmit = async (data: CreateMatchForm) => {
    const result = await createMatch({
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      description: data.description || undefined,
      slots: data.slots,
      whatsapp_link: data.whatsapp_link || undefined,
    })

    if (result) {
      setSuccess(true)
      setTimeout(() => {
        navigate(`/matches/${result.id}`)
      }, 1500)
    }
  }

  useEffect(() => {
    document.title = 'Crear Partido — SportMates'
  }, [])

  if (success) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="text-center max-w-md w-full py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">¡Partido creado!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Redirigiendo al detalle del partido...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-verde-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear un Partido</h1>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Fecha
              </label>
              <input
                type="date"
                {...register('date')}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
                  placeholder:text-gray-400 transition-colors min-h-[44px]
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  ${errors.date ? 'border-rojo-alert' : 'border-gris-border'}`}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-rojo-alert">{errors.date.message}</p>
              )}
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Inicio
                </label>
                <input
                  type="time"
                  {...register('start_time')}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
                    transition-colors min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                    ${errors.start_time ? 'border-rojo-alert' : 'border-gris-border'}`}
                />
                {errors.start_time && (
                  <p className="mt-1 text-xs text-rojo-alert">{errors.start_time.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Fin
                </label>
                <input
                  type="time"
                  {...register('end_time')}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
                    transition-colors min-h-[44px]
                    focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                    ${errors.end_time ? 'border-rojo-alert' : 'border-gris-border'}`}
                />
                {errors.end_time && (
                  <p className="mt-1 text-xs text-rojo-alert">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <TextInput
              label="Zona / Cancha"
              placeholder="Ej: Palermo, Cancha 11"
              error={errors.location?.message}
              {...register('location')}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlignLeft className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describí el partido, nivel, qué llevar, etc."
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
                  placeholder:text-gray-400 transition-colors min-h-[88px] resize-y
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  ${errors.description ? 'border-rojo-alert' : 'border-gris-border'}`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rojo-alert">{errors.description.message}</p>
              )}
            </div>

            {/* Slots */}
            <TextInput
              label="Cupos totales"
              type="number"
              placeholder="14"
              error={errors.slots?.message}
              {...register('slots', { valueAsNumber: true })}
            />

            {/* WhatsApp link */}
            <TextInput
              label="Link del grupo de WhatsApp"
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              error={errors.whatsapp_link?.message}
              {...register('whatsapp_link')}
            />

            {/* Submit error */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-rojo-alert/30 p-3">
                <p className="text-sm text-rojo-alert">{submitError.message}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Publicar partido
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
