'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { validarRut, normalizarRut } from '@/lib/validaciones/rut'
import { validarNit, normalizarNit } from '@/lib/validaciones/nit'
import { crearClienteServidor } from '@/lib/supabase/server'

const esquemaEmpresa = z
  .object({
    razon_social: z.string().trim().min(1, 'La razón social es obligatoria'),
    pais_domicilio: z.enum(['chile', 'bolivia']),
    identificador_fiscal: z.string().trim().min(1, 'El identificador fiscal es obligatorio'),
    direccion: z.string().trim().optional(),
    ciudad: z.string().trim().optional(),
    contacto_nombre: z.string().trim().optional(),
    telefono: z.string().trim().optional(),
    email: z.union([z.literal(''), z.string().trim().email('Email inválido')]).optional(),
  })
  .superRefine((datos, ctx) => {
    const esValido =
      datos.pais_domicilio === 'chile'
        ? validarRut(datos.identificador_fiscal)
        : validarNit(datos.identificador_fiscal)

    if (!esValido) {
      ctx.addIssue({
        code: 'custom',
        path: ['identificador_fiscal'],
        message:
          datos.pais_domicilio === 'chile'
            ? 'RUT inválido (verifica el dígito verificador)'
            : 'NIT inválido (debe tener entre 7 y 9 dígitos)',
      })
    }
  })

export type EstadoFormularioEmpresa = {
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

function extraerDatosFormulario(formData: FormData) {
  return {
    razon_social: String(formData.get('razon_social') ?? ''),
    pais_domicilio: String(formData.get('pais_domicilio') ?? ''),
    identificador_fiscal: String(formData.get('identificador_fiscal') ?? ''),
    direccion: String(formData.get('direccion') ?? ''),
    ciudad: String(formData.get('ciudad') ?? ''),
    contacto_nombre: String(formData.get('contacto_nombre') ?? ''),
    telefono: String(formData.get('telefono') ?? ''),
    email: String(formData.get('email') ?? ''),
  }
}

export async function crearEmpresa(
  _estadoPrevio: EstadoFormularioEmpresa,
  formData: FormData
): Promise<EstadoFormularioEmpresa> {
  const datos = extraerDatosFormulario(formData)
  const resultado = esquemaEmpresa.safeParse(datos)

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data
  const identificadorNormalizado =
    d.pais_domicilio === 'chile' ? normalizarRut(d.identificador_fiscal) : normalizarNit(d.identificador_fiscal)

  const creadoPorId = await obtenerUsuarioActualId()

  await db.insert(empresas_cliente).values({
    razon_social: d.razon_social,
    pais_domicilio: d.pais_domicilio,
    identificador_fiscal: identificadorNormalizado,
    direccion: d.direccion || null,
    ciudad: d.ciudad || null,
    contacto_nombre: d.contacto_nombre || null,
    telefono: d.telefono || null,
    email: d.email || null,
    created_by: creadoPorId,
  })

  revalidatePath('/empresas')
  redirect('/empresas')
}

export async function actualizarEmpresa(
  id: string,
  _estadoPrevio: EstadoFormularioEmpresa,
  formData: FormData
): Promise<EstadoFormularioEmpresa> {
  const datos = extraerDatosFormulario(formData)
  const resultado = esquemaEmpresa.safeParse(datos)

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data
  const identificadorNormalizado =
    d.pais_domicilio === 'chile' ? normalizarRut(d.identificador_fiscal) : normalizarNit(d.identificador_fiscal)

  await db
    .update(empresas_cliente)
    .set({
      razon_social: d.razon_social,
      pais_domicilio: d.pais_domicilio,
      identificador_fiscal: identificadorNormalizado,
      direccion: d.direccion || null,
      ciudad: d.ciudad || null,
      contacto_nombre: d.contacto_nombre || null,
      telefono: d.telefono || null,
      email: d.email || null,
      updated_at: new Date(),
    })
    .where(eq(empresas_cliente.id, id))

  revalidatePath('/empresas')
  redirect('/empresas')
}

export async function desactivarEmpresa(id: string) {
  await db.update(empresas_cliente).set({ activo: false, updated_at: new Date() }).where(eq(empresas_cliente.id, id))
  revalidatePath('/empresas')
}
