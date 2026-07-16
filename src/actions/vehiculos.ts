'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { vehiculos } from '@/lib/db/schema'
import { validarPatente, normalizarPatente } from '@/lib/validaciones/patente'

const esquemaVehiculo = z.object({
  empresa_id: z.string().uuid('Selecciona una empresa'),
  patente: z.string().trim().refine(validarPatente, 'La patente es muy corta'),
  pais_matricula: z.enum(['chile', 'bolivia']),
  tipo_vehiculo: z.enum(['carga', 'pasajeros']),
  marca: z.string().trim().optional(),
  modelo: z.string().trim().optional(),
  anio: z.union([z.literal(''), z.coerce.number().int().min(1950).max(2100)]).optional(),
  fecha_habilitacion: z.union([z.literal(''), z.string()]).optional(),
  fecha_vencimiento_habilitacion: z.union([z.literal(''), z.string()]).optional(),
  notas: z.string().trim().optional(),
})

export type EstadoFormularioVehiculo = {
  error: string | null
  errores?: Record<string, string[]>
}

function extraerDatosFormulario(formData: FormData) {
  return {
    empresa_id: String(formData.get('empresa_id') ?? ''),
    patente: String(formData.get('patente') ?? ''),
    pais_matricula: String(formData.get('pais_matricula') ?? ''),
    tipo_vehiculo: String(formData.get('tipo_vehiculo') ?? ''),
    marca: String(formData.get('marca') ?? ''),
    modelo: String(formData.get('modelo') ?? ''),
    anio: String(formData.get('anio') ?? ''),
    fecha_habilitacion: String(formData.get('fecha_habilitacion') ?? ''),
    fecha_vencimiento_habilitacion: String(formData.get('fecha_vencimiento_habilitacion') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  }
}

export async function crearVehiculo(
  _estadoPrevio: EstadoFormularioVehiculo,
  formData: FormData
): Promise<EstadoFormularioVehiculo> {
  const resultado = esquemaVehiculo.safeParse(extraerDatosFormulario(formData))

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  await db.insert(vehiculos).values({
    empresa_id: d.empresa_id,
    patente: normalizarPatente(d.patente),
    pais_matricula: d.pais_matricula,
    tipo_vehiculo: d.tipo_vehiculo,
    marca: d.marca || null,
    modelo: d.modelo || null,
    anio: d.anio ? Number(d.anio) : null,
    fecha_habilitacion: d.fecha_habilitacion || null,
    fecha_vencimiento_habilitacion: d.fecha_vencimiento_habilitacion || null,
    notas: d.notas || null,
  })

  revalidatePath('/vehiculos')
  redirect('/vehiculos')
}

export async function actualizarVehiculo(
  id: string,
  _estadoPrevio: EstadoFormularioVehiculo,
  formData: FormData
): Promise<EstadoFormularioVehiculo> {
  const resultado = esquemaVehiculo.safeParse(extraerDatosFormulario(formData))

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  await db
    .update(vehiculos)
    .set({
      empresa_id: d.empresa_id,
      patente: normalizarPatente(d.patente),
      pais_matricula: d.pais_matricula,
      tipo_vehiculo: d.tipo_vehiculo,
      marca: d.marca || null,
      modelo: d.modelo || null,
      anio: d.anio ? Number(d.anio) : null,
      fecha_habilitacion: d.fecha_habilitacion || null,
      fecha_vencimiento_habilitacion: d.fecha_vencimiento_habilitacion || null,
      notas: d.notas || null,
      updated_at: new Date(),
    })
    .where(eq(vehiculos.id, id))

  revalidatePath('/vehiculos')
  redirect('/vehiculos')
}

export async function cambiarEstadoVehiculo(id: string, estado: 'habilitado' | 'inhabilitado' | 'suspendido') {
  await db.update(vehiculos).set({ estado, updated_at: new Date() }).where(eq(vehiculos.id, id))
  revalidatePath('/vehiculos')
}
