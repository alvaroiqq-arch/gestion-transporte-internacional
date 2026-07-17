'use server'

import { z } from 'zod'
import Decimal from 'decimal.js'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagos, tramites, audit_log } from '@/lib/db/schema'
import { redondearMonto } from '@/lib/calculos/moneda'
import { crearClienteServidor } from '@/lib/supabase/server'
import { subirArchivoTramite } from '@/lib/supabase/storage'

const esquemaPago = z.object({
  monto: z
    .string()
    .trim()
    .min(1, 'El monto es obligatorio')
    .refine((v) => {
      try {
        return new Decimal(v).isPositive() && !new Decimal(v).isZero()
      } catch {
        return false
      }
    }, 'Ingresa un monto válido mayor a 0'),
  moneda: z.enum(['CLP', 'BOB', 'USD']),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'deposito', 'otro']),
  responsable_cobro_id: z.string().uuid('Selecciona quién cobró el pago'),
  fecha_pago: z.string().min(1, 'La fecha de pago es obligatoria'),
  notas: z.string().trim().optional(),
})

export type EstadoFormularioPago = {
  error: string | null
  errores?: Record<string, string[]>
}

async function obtenerUsuarioActual() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const usuario = await db.query.usuarios.findFirst({
    where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id),
  })
  return usuario ?? null
}

// Los pagos de trámites de Bolivia requieren validación de un usuario a cargo
// de Bolivia (pais_gestion = 'bolivia', o null = ambos países) antes de quedar
// 'pagado'; los de Chile no la requieren y quedan 'pagado' de inmediato.
function puedeValidarPagosBolivia(usuario: { pais_gestion: 'chile' | 'bolivia' | null } | null): boolean {
  return usuario !== null && (usuario.pais_gestion === 'bolivia' || usuario.pais_gestion === null)
}

export async function registrarPago(
  tramiteId: string,
  _estadoPrevio: EstadoFormularioPago,
  formData: FormData
): Promise<EstadoFormularioPago> {
  const resultado = esquemaPago.safeParse({
    monto: String(formData.get('monto') ?? ''),
    moneda: String(formData.get('moneda') ?? ''),
    metodo_pago: String(formData.get('metodo_pago') ?? ''),
    responsable_cobro_id: String(formData.get('responsable_cobro_id') ?? ''),
    fecha_pago: String(formData.get('fecha_pago') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  })

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  const tramite = await db.query.tramites.findFirst({ where: (tramites, { eq }) => eq(tramites.id, tramiteId) })
  if (!tramite) {
    return { error: 'El trámite no existe.' }
  }
  if (tramite.estado === 'anulado') {
    return { error: 'No se pueden registrar pagos en un trámite anulado.' }
  }

  const supabase = await crearClienteServidor()

  let comprobanteUrl: string | null = null
  const archivo = formData.get('comprobante')
  if (archivo instanceof File && archivo.size > 0) {
    try {
      comprobanteUrl = await subirArchivoTramite(supabase, `pagos/${tramiteId}`, archivo)
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo subir el comprobante.' }
    }
  }

  const usuarioActual = await obtenerUsuarioActual()
  const creadoPorId = usuarioActual?.id ?? null

  // Bolivia requiere validación de un usuario a cargo de Bolivia antes de
  // quedar 'pagado'; Chile no la requiere y queda 'pagado' de inmediato.
  const requiereValidacion = tramite.pais === 'bolivia'

  await db.transaction(async (tx) => {
    const [pago] = await tx
      .insert(pagos)
      .values({
        tramite_id: tramiteId,
        pais_destino: tramite.pais,
        monto: redondearMonto(d.monto, d.moneda),
        moneda: d.moneda,
        metodo_pago: d.metodo_pago,
        estado: requiereValidacion ? 'pendiente' : 'pagado',
        responsable_cobro_id: d.responsable_cobro_id,
        fecha_pago: d.fecha_pago,
        comprobante_url: comprobanteUrl,
        notas: d.notas || null,
        created_by: creadoPorId,
      })
      .returning({ id: pagos.id })

    await tx.insert(audit_log).values({
      entidad: 'pago',
      entidad_id: pago.id,
      accion: 'creacion',
      estado_nuevo: requiereValidacion ? 'pendiente' : 'pagado',
      created_by: creadoPorId,
    })
  })

  revalidatePath(`/tramites/${tramiteId}`)
  return { error: null }
}

export async function anularPago(id: string, tramiteId: string) {
  const usuarioActual = await obtenerUsuarioActual()
  const creadoPorId = usuarioActual?.id ?? null

  await db.transaction(async (tx) => {
    const pagoActual = await tx.query.pagos.findFirst({ where: (pagos, { eq }) => eq(pagos.id, id) })
    if (!pagoActual) return

    await tx.update(pagos).set({ estado: 'anulado' }).where(eq(pagos.id, id))

    await tx.insert(audit_log).values({
      entidad: 'pago',
      entidad_id: id,
      accion: 'anulacion',
      estado_anterior: pagoActual.estado,
      estado_nuevo: 'anulado',
      created_by: creadoPorId,
    })
  })

  revalidatePath(`/tramites/${tramiteId}`)
}

// Valida un pago pendiente de un trámite de Bolivia — solo lo puede hacer un
// usuario a cargo de Bolivia. Los pagos de Chile no pasan por 'pendiente',
// así que no hay nada que validar en ese caso.
export async function validarPago(id: string, tramiteId: string) {
  const usuarioActual = await obtenerUsuarioActual()
  if (!puedeValidarPagosBolivia(usuarioActual)) return

  await db.transaction(async (tx) => {
    const pagoActual = await tx.query.pagos.findFirst({ where: (pagos, { eq }) => eq(pagos.id, id) })
    if (!pagoActual || pagoActual.estado !== 'pendiente' || pagoActual.pais_destino !== 'bolivia') return

    await tx
      .update(pagos)
      .set({ estado: 'pagado', validado_por_id: usuarioActual!.id, fecha_validacion: new Date() })
      .where(eq(pagos.id, id))

    await tx.insert(audit_log).values({
      entidad: 'pago',
      entidad_id: id,
      accion: 'validacion',
      estado_anterior: 'pendiente',
      estado_nuevo: 'pagado',
      created_by: usuarioActual!.id,
    })
  })

  revalidatePath(`/tramites/${tramiteId}`)
}
