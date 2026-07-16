'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, tramite_vehiculos, tipos_tramite, audit_log } from '@/lib/db/schema'
import { crearClienteServidor } from '@/lib/supabase/server'

const esquemaTramite = z.object({
  empresa_id: z.string().uuid('Selecciona una empresa'),
  tipo_tramite_id: z.string().uuid('Selecciona un tipo de trámite'),
  fecha_solicitud: z.string().min(1, 'La fecha de solicitud es obligatoria'),
  vehiculo_ids: z.array(z.string().uuid()).optional().default([]),
  notas: z.string().trim().optional(),
})

export type EstadoFormularioTramite = {
  error: string | null
  errores?: Record<string, string[]>
}

async function obtenerUsuarioActualId(): Promise<string | null> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const usuario = await db.query.usuarios.findFirst({
    where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id),
  })
  return usuario?.id ?? null
}

export async function crearTramite(
  _estadoPrevio: EstadoFormularioTramite,
  formData: FormData
): Promise<EstadoFormularioTramite> {
  const resultado = esquemaTramite.safeParse({
    empresa_id: String(formData.get('empresa_id') ?? ''),
    tipo_tramite_id: String(formData.get('tipo_tramite_id') ?? ''),
    fecha_solicitud: String(formData.get('fecha_solicitud') ?? ''),
    vehiculo_ids: formData.getAll('vehiculo_ids').map(String),
    notas: String(formData.get('notas') ?? ''),
  })

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  const tipoTramite = await db.query.tipos_tramite.findFirst({
    where: eq(tipos_tramite.id, d.tipo_tramite_id),
  })

  if (!tipoTramite) {
    return { error: 'El tipo de trámite seleccionado no existe.' }
  }

  if (tipoTramite.requiere_vehiculo && d.vehiculo_ids.length === 0) {
    return {
      error: 'Este tipo de trámite requiere al menos un vehículo.',
      errores: { vehiculo_ids: ['Selecciona al menos un vehículo'] },
    }
  }

  const creadoPorId = await obtenerUsuarioActualId()

  const [tramite] = await db
    .insert(tramites)
    .values({
      tipo_tramite_id: tipoTramite.id,
      pais: tipoTramite.pais,
      empresa_id: d.empresa_id,
      fecha_solicitud: d.fecha_solicitud,
      monto_total: tipoTramite.precio,
      moneda: tipoTramite.moneda,
      notas: d.notas || null,
      created_by: creadoPorId,
    })
    .returning({ id: tramites.id })

  if (d.vehiculo_ids.length > 0) {
    await db.insert(tramite_vehiculos).values(
      d.vehiculo_ids.map((vehiculo_id) => ({ tramite_id: tramite.id, vehiculo_id }))
    )
  }

  revalidatePath('/tramites')
  redirect(`/tramites/${tramite.id}`)
}

const estadosValidos = ['en_curso', 'pendiente_observado', 'concluido', 'anulado'] as const

export async function cambiarEstadoTramite(id: string, estado: (typeof estadosValidos)[number]) {
  const creadoPorId = await obtenerUsuarioActualId()

  await db.transaction(async (tx) => {
    const tramiteActual = await tx.query.tramites.findFirst({ where: eq(tramites.id, id) })
    if (!tramiteActual) return

    await tx.update(tramites).set({ estado, updated_at: new Date() }).where(eq(tramites.id, id))

    await tx.insert(audit_log).values({
      entidad: 'tramite',
      entidad_id: id,
      accion: 'cambio_estado',
      estado_anterior: tramiteActual.estado,
      estado_nuevo: estado,
      created_by: creadoPorId,
    })
  })

  revalidatePath('/tramites')
  revalidatePath(`/tramites/${id}`)
}
