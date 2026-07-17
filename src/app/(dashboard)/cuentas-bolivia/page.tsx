import Link from 'next/link'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagos, tramites, empresas_cliente } from '@/lib/db/schema'
import { sumarPorMoneda } from '@/lib/calculos/remesas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

export default async function PaginaCuentasBolivia() {
  // Fondos cobrados en Chile que corresponden a trámites de Bolivia — dinero
  // que todavía hay que entregar/transferir a Bolivia
  const fondosPorEnviarABolivia = await db
    .select({
      id: pagos.id,
      monto: pagos.monto,
      moneda: pagos.moneda,
      fecha_pago: pagos.fecha_pago,
      tramiteId: tramites.id,
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
    .orderBy(desc(pagos.fecha_pago))

  const totalesPorEnviar = sumarPorMoneda(fondosPorEnviarABolivia)

  return (
    <div>
      <PageHeader titulo="Cuentas Bolivia" descripcion="Saldo y movimientos de caja Bolivia" />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Fondos pendientes de enviar a Bolivia</CardTitle>
          {fondosPorEnviarABolivia.length > 0 && (
            <Button size="sm" asChild>
              <Link href="/remesas/nueva">Armar envío</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {fondosPorEnviarABolivia.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fondos pendientes de enviar a Bolivia.</p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium">
                Total pendiente:{' '}
                {Object.entries(totalesPorEnviar)
                  .map(([moneda, monto]) => `${monto} ${moneda}`)
                  .join(' · ')}
              </p>
              <ul className="flex flex-col divide-y divide-border">
                {fondosPorEnviarABolivia.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/tramites/${p.tramiteId}`} className="font-medium hover:underline">
                        Trámite N° {p.tramiteNumero}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">
                        {p.empresa} · cobrado {p.fecha_pago}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {p.monto} {p.moneda}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
