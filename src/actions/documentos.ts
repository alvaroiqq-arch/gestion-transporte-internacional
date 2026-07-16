'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { documentos_generados, tramites } from '@/lib/db/schema'
import { crearClienteServidor } from '@/lib/supabase/server'
import { subirArchivoTramite } from '@/lib/supabase/storage'

const esquemaDocumento = z.object({
  tipo_documento: z.string().trim().min(1, 'El tipo de documento es obligatorio'),
  fecha_emision: z.string().min(1, 'La fecha de emisión es obligatoria'),
  notas: z.string().trim().optional(),
})

export type EstadoFormularioDocumento = {
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

export async function registrarDocumento(
  tramiteId: string,
  _estadoPrevio: EstadoFormularioDocumento,
  formData: FormData
): Promise<EstadoFormularioDocumento> {
  const resultado = esquemaDocumento.safeParse({
    tipo_documento: String(formData.get('tipo_documento') ?? ''),
    fecha_emision: String(formData.get('fecha_emision') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  })

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const archivo = formData.get('archivo')
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: 'Selecciona el archivo del documento.', errores: { archivo: ['Selecciona un archivo'] } }
  }

  const tramite = await db.query.tramites.findFirst({ where: eq(tramites.id, tramiteId) })
  if (!tramite) {
    return { error: 'El trámite no existe.' }
  }

  const d = resultado.data
  const supabase = await crearClienteServidor()

  let archivoUrl: string
  try {
    archivoUrl = await subirArchivoTramite(supabase, `documentos/${tramiteId}`, archivo)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo subir el documento.' }
  }

  const creadoPorId = await obtenerUsuarioActualId()

  await db.insert(documentos_generados).values({
    tramite_id: tramiteId,
    tipo_documento: d.tipo_documento,
    archivo_url: archivoUrl,
    fecha_emision: d.fecha_emision,
    notas: d.notas || null,
    created_by: creadoPorId,
  })

  revalidatePath(`/tramites/${tramiteId}`)
  return { error: null }
}
