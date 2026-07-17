import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagos, tramites, empresas_cliente } from '@/lib/db/schema'
import { FormularioRemesa } from '@/components/remesas/formulario-remesa'
import { FormShell } from '@/components/layout/form-shell'
import { crearRemesa } from '@/actions/remesas'

export default async function PaginaNuevaRemesa() {
  const pagosPendientes = await db
    .select({
      id: pagos.id,
      monto: pagos.monto,
      moneda: pagos.moneda,
      fecha_pago: pagos.fecha_pago,
      tramiteNumero: tramites.numero,
      empresa: empresas_cliente.razon_social,
    })
    .from(pagos)
    .innerJoin(tramites, eq(pagos.tramite_id, tramites.id))
    .innerJoin(empresas_cliente, eq(tramites.empresa_id, empresas_cliente.id))
    .where(
      and(
        eq(pagos.pais_recepcion, 'chile'),
        eq(pagos.pais_destino, 'bolivia'),
        eq(pagos.estado, 'pagado'),
        isNull(pagos.remesa_id)
      )
    )
    .orderBy(pagos.fecha_pago)

  const pagosPorMoneda: Record<string, typeof pagosPendientes> = {}
  for (const p of pagosPendientes) {
    ;(pagosPorMoneda[p.moneda] ??= []).push(p)
  }

  return (
    <FormShell titulo="Nueva remesa" volverHref="/remesas" volverTexto="Volver a remesas">
      {pagosPendientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay pagos cobrados en Chile pendientes de enviar a Bolivia en este momento.
        </p>
      ) : (
        <FormularioRemesa accion={crearRemesa} pagosPorMoneda={pagosPorMoneda} />
      )}
    </FormShell>
  )
}
