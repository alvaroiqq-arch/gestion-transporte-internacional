import Link from 'next/link'
import { notFound } from 'next/navigation'
import Decimal from 'decimal.js'
import { db } from '@/lib/db'
import { calcularMontoNeto } from '@/lib/calculos/remesas'
import { crearClienteServidor } from '@/lib/supabase/server'
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
import { EstadoRemesaBadge } from '@/components/estados/estado-badges'
import { confirmarRecepcionRemesa } from '@/actions/remesas'

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default async function PaginaDetalleRemesa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const remesa = await db.query.remesas.findFirst({
    where: (remesas, { eq }) => eq(remesas.id, id),
    with: {
      enviadoPor: true,
      recibidoPor: true,
      pagos: { with: { tramite: { with: { empresa: true } } } },
    },
  })

  if (!remesa) notFound()

  const total = remesa.pagos
    .reduce((acumulado, p) => acumulado.plus(p.monto), new Decimal(0))
    .toString()
  const montoNeto = calcularMontoNeto(total, remesa.comision, remesa.moneda)

  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const usuarioActual = user
    ? await db.query.usuarios.findFirst({ where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id) })
    : null
  const puedeConfirmar =
    remesa.estado === 'enviada' &&
    usuarioActual != null &&
    (usuarioActual.pais_gestion === 'bolivia' || usuarioActual.pais_gestion === null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link href="/remesas">Volver a remesas</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1>Remesa N° {remesa.numero}</h1>
          <EstadoRemesaBadge estado={remesa.estado} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monto neto que recibe Bolivia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{montoNeto} {remesa.moneda}</p>
          <dl className="mt-3 flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Total recaudado en Chile</dt>
              <dd className="font-medium tabular-nums">{total} {remesa.moneda}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Comisión de transferencia</dt>
              <dd className="font-medium tabular-nums">{remesa.comision} {remesa.moneda}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos del envío</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Dato etiqueta="Fecha de envío">{remesa.fecha_envio}</Dato>
            <Dato etiqueta="Enviado por">{remesa.enviadoPor?.nombre ?? '—'}</Dato>
            <Dato etiqueta="Fecha de recepción">
              {remesa.fecha_recepcion ? remesa.fecha_recepcion.toISOString().slice(0, 10) : 'Aún no confirmada'}
            </Dato>
            <Dato etiqueta="Recibido por">{remesa.recibidoPor?.nombre ?? '—'}</Dato>
            {remesa.notas && <Dato etiqueta="Notas">{remesa.notas}</Dato>}
          </dl>

          {puedeConfirmar && (
            <form action={confirmarRecepcionRemesa.bind(null, remesa.id)} className="mt-4 border-t border-border pt-4">
              <Button type="submit">Confirmar recepción en Bolivia</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos incluidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Trámite</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha de pago</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remesa.pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/tramites/${p.tramite.id}`} className="font-medium hover:underline">
                        N° {p.tramite.numero}
                      </Link>
                    </TableCell>
                    <TableCell>{p.tramite.empresa.razon_social}</TableCell>
                    <TableCell className="tabular-nums">{p.fecha_pago}</TableCell>
                    <TableCell className="tabular-nums">{p.monto} {p.moneda}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
