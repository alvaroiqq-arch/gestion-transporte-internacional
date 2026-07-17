'use server'

import { z } from 'zod'
import Decimal from 'decimal.js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and, inArray, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagos, remesas, audit_log } from '@/lib/db/schema'
import { tienenMonedaUnica, sumarPorMoneda } from '@/lib/calculos/remesas'
import { redondearMonto } from '@/lib/calculos/moneda'
import { crearClienteServidor } from '@/lib/supabase/server'

const esquemaRemesa = z.object({
  pago_ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos un pago'),
  fecha_envio: z.string().min(1, 'La fecha de envío es obligatoria'),
  comision: z
    .string()
    .trim()
    .refine((v) => {
      if (v === '') return true
      try {
        return !new Decimal(v).isNegative()
      } catch {
        return false
      }
    }, 'La comisión debe ser un monto válido, mayor o igual a 0'),
  notas: z.string().trim().optional(),
})

export type EstadoFormularioRemesa = {
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

// Confirmar recepción es un acto de Bolivia (mismo criterio que validar pagos):
// pais_gestion = 'bolivia', o null = ambos países
function puedeConfirmarRecepcion(usuario: { pais_gestion: 'chile' | 'bolivia' | null } | null): boolean {
  return usuario !== null && (usuario.pais_gestion === 'bolivia' || usuario.pais_gestion === null)
}

export async function crearRemesa(
  _estadoPrevio: EstadoFormularioRemesa,
  formData: FormData
): Promise<EstadoFormularioRemesa> {
  const resultado = esquemaRemesa.safeParse({
    pago_ids: formData.getAll('pago_ids').map(String),
    fecha_envio: String(formData.get('fecha_envio') ?? ''),
    comision: String(formData.get('comision') ?? ''),
    notas: String(formData.get('notas') ?? ''),
  })

  if (!resultado.success) {
    return { error: 'Revisa los campos marcados.', errores: resultado.error.flatten().fieldErrors }
  }

  const d = resultado.data

  const usuarioActual = await obtenerUsuarioActual()
  if (!usuarioActual) {
    return { error: 'No hay sesión activa.' }
  }
  // El envío lo arma quien tiene los fondos en Chile — Bolivia solo confirma recepción
  if (usuarioActual.pais_gestion === 'bolivia') {
    return { error: 'Solo un usuario a cargo de Chile puede armar un envío de fondos.' }
  }

  // Volver a leer los pagos desde la BD: nunca confiar en lo que llegó del formulario
  const pagosSeleccionados = await db
    .select({ id: pagos.id, monto: pagos.monto, moneda: pagos.moneda })
    .from(pagos)
    .where(
      and(
        inArray(pagos.id, d.pago_ids),
        eq(pagos.pais_recepcion, 'chile'),
        eq(pagos.pais_destino, 'bolivia'),
        eq(pagos.estado, 'pagado'),
        isNull(pagos.remesa_id)
      )
    )

  if (pagosSeleccionados.length !== d.pago_ids.length) {
    return {
      error: 'Alguno de los pagos seleccionados ya no está disponible (puede que otra remesa ya lo haya incluido).',
    }
  }

  if (!tienenMonedaUnica(pagosSeleccionados)) {
    return { error: 'Todos los pagos de una remesa deben ser de la misma moneda.' }
  }

  const moneda = pagosSeleccionados[0].moneda
  const idsPagos = pagosSeleccionados.map((p) => p.id)
  const totalRecaudado = sumarPorMoneda(pagosSeleccionados)[moneda]!
  const comision = redondearMonto(d.comision || '0', moneda)

  if (new Decimal(comision).greaterThan(totalRecaudado)) {
    return {
      error: 'La comisión no puede ser mayor al total recaudado.',
      errores: { comision: ['No puede superar el total recaudado'] },
    }
  }

  const [remesa] = await db.transaction(async (tx) => {
    const [nuevaRemesa] = await tx
      .insert(remesas)
      .values({
        moneda,
        comision,
        fecha_envio: d.fecha_envio,
        enviado_por_id: usuarioActual.id,
        notas: d.notas || null,
        created_by: usuarioActual.id,
      })
      .returning({ id: remesas.id })

    await tx
      .update(pagos)
      .set({ remesa_id: nuevaRemesa.id })
      .where(and(inArray(pagos.id, idsPagos), isNull(pagos.remesa_id)))

    await tx.insert(audit_log).values({
      entidad: 'remesa',
      entidad_id: nuevaRemesa.id,
      accion: 'creacion',
      estado_nuevo: 'enviada',
      created_by: usuarioActual.id,
    })

    return [nuevaRemesa]
  })

  revalidatePath('/')
  revalidatePath('/remesas')
  redirect(`/remesas/${remesa.id}`)
}

export async function confirmarRecepcionRemesa(id: string) {
  const usuarioActual = await obtenerUsuarioActual()
  if (!puedeConfirmarRecepcion(usuarioActual)) return

  await db.transaction(async (tx) => {
    const remesaActual = await tx.query.remesas.findFirst({ where: (remesas, { eq }) => eq(remesas.id, id) })
    if (!remesaActual || remesaActual.estado !== 'enviada') return

    await tx
      .update(remesas)
      .set({ estado: 'recibida', fecha_recepcion: new Date(), recibido_por_id: usuarioActual!.id })
      .where(eq(remesas.id, id))

    await tx.insert(audit_log).values({
      entidad: 'remesa',
      entidad_id: id,
      accion: 'confirmacion_recepcion',
      estado_anterior: 'enviada',
      estado_nuevo: 'recibida',
      created_by: usuarioActual!.id,
    })
  })

  revalidatePath('/')
  revalidatePath('/remesas')
  revalidatePath(`/remesas/${id}`)
}
