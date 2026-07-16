'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tipos_tramite } from '@/lib/db/schema'
import { redondearMonto } from '@/lib/calculos/moneda'

const esquemaTipoTramite = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  pais: z.enum(['chile', 'bolivia']),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  moneda: z.enum(['CLP', 'BOB', 'USD']),
  vigencia_meses: z.union([z.literal(''), z.coerce.number().int().positive()]).optional(),
  requiere_vehiculo: z.enum(['on']).optional(),
})

export type EstadoFormularioTipoTramite = {
  error: string | null
  errores?: Record<string, string[]>
}

function extraerDatosFormulario(formData: FormData) {
  return {
    nombre: String(formData.get('nombre') ?? ''),
    pais: String(formData.get('pais') ?? ''),
    descripcion: String(formData.get('descripcion') ?? ''),
    precio: String(formData.get('precio') ?? ''),
    moneda: String(formData.get('moneda') ?? ''),
    vigencia_meses: String(formData.get('vigencia_meses') ?? ''),
    requiere_vehiculo: formData.get('requiere_vehiculo') ? ('on' as const) : undefined,
  }
}

export async function crearTipoTramite(
  _estadoPrevio: EstadoFormularioTipoTramite,
  formData: FormData
): Promise<EstadoFormularioTipoTramite> {
  const resultado = esquemaTipoTramite.safeParse(extraerDatosFormulario(formData))

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  await db.insert(tipos_tramite).values({
    nombre: d.nombre,
    pais: d.pais,
    descripcion: d.descripcion || null,
    precio: redondearMonto(d.precio, d.moneda),
    moneda: d.moneda,
    vigencia_meses: d.vigencia_meses ? Number(d.vigencia_meses) : null,
    requiere_vehiculo: d.requiere_vehiculo === 'on',
  })

  revalidatePath('/tipos-tramite')
  redirect('/tipos-tramite')
}

export async function actualizarTipoTramite(
  id: string,
  _estadoPrevio: EstadoFormularioTipoTramite,
  formData: FormData
): Promise<EstadoFormularioTipoTramite> {
  const resultado = esquemaTipoTramite.safeParse(extraerDatosFormulario(formData))

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  await db
    .update(tipos_tramite)
    .set({
      nombre: d.nombre,
      pais: d.pais,
      descripcion: d.descripcion || null,
      precio: redondearMonto(d.precio, d.moneda),
      moneda: d.moneda,
      vigencia_meses: d.vigencia_meses ? Number(d.vigencia_meses) : null,
      requiere_vehiculo: d.requiere_vehiculo === 'on',
      updated_at: new Date(),
    })
    .where(eq(tipos_tramite.id, id))

  revalidatePath('/tipos-tramite')
  redirect('/tipos-tramite')
}

export async function cambiarActivoTipoTramite(id: string, activo: boolean) {
  await db.update(tipos_tramite).set({ activo, updated_at: new Date() }).where(eq(tipos_tramite.id, id))
  revalidatePath('/tipos-tramite')
}
