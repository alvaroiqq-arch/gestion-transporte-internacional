import Link from 'next/link'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagos, tramites, empresas_cliente } from '@/lib/db/schema'
import { sumarPorMoneda } from '@/lib/calculos/remesas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { EstadoPagoBadge, PaisBadge } from '@/components/estados/estado-badges'

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

  // Detalle de movimientos: todos los pagos de trámites de Bolivia (cualquier
  // estado y cualquier país de recepción) — el libro de movimientos del negocio ahí
  const movimientosBolivia = await db
    .select({
      id: pagos.id,
      fecha_pago: pagos.fecha_pago,
      monto: pagos.monto,
      moneda: pagos.moneda,
      pais_recepcion: pagos.pais_recepcion,
      estado: pagos.estado,
      tramiteId: tramites.id,
      tramiteNumero: tramites.numero,
      empresa: empresas_cliente.razon_social,
    })
    .from(pagos)
    .innerJoin(tramites, eq(pagos.tramite_id, tramites.id))
    .innerJoin(empresas_cliente, eq(tramites.empresa_id, empresas_cliente.id))
    .where(eq(tramites.pais, 'bolivia'))
    .orderBy(desc(pagos.fecha_pago))

  const totalesMovidos = sumarPorMoneda(movimientosBolivia.filter((m) => m.estado === 'pagado'))

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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detalle de movimientos — servicios Bolivia</CardTitle>
        </CardHeader>
        <CardContent>
          {movimientosBolivia.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay movimientos en trámites de Bolivia.</p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium">
                Total movido (pagado):{' '}
                {Object.entries(totalesMovidos)
                  .map(([moneda, monto]) => `${monto} ${moneda}`)
                  .join(' · ') || '—'}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Trámite</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Recibido en</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosBolivia.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="tabular-nums">{m.fecha_pago}</TableCell>
                        <TableCell>
                          <Link href={`/tramites/${m.tramiteId}`} className="font-medium hover:underline">
                            N° {m.tramiteNumero}
                          </Link>
                        </TableCell>
                        <TableCell>{m.empresa}</TableCell>
                        <TableCell className="tabular-nums">{m.monto} {m.moneda}</TableCell>
                        <TableCell>
                          <PaisBadge pais={m.pais_recepcion} />
                        </TableCell>
                        <TableCell>
                          <EstadoPagoBadge estado={m.estado} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
