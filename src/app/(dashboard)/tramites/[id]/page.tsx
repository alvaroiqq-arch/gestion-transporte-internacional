import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, tramite_vehiculos, vehiculos, usuarios } from '@/lib/db/schema'
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
import {
  EstadoTramiteBadge,
  EstadoPagoBadge,
  PaisBadge,
} from '@/components/estados/estado-badges'
import { cambiarEstadoTramite, actualizarSeguimientoTramite } from '@/actions/tramites'
import { registrarPago, anularPago, validarPago } from '@/actions/pagos'
import { registrarDocumento } from '@/actions/documentos'
import { calcularSaldoTramite } from '@/lib/calculos/saldo'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerUrlFirmada } from '@/lib/supabase/storage'
import { FormularioPago } from '@/components/pagos/formulario-pago'
import { FormularioDocumento } from '@/components/documentos/formulario-documento'
import { FormularioSeguimiento } from '@/components/tramites/formulario-seguimiento'

const etiquetaMetodoPago: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  deposito: 'Depósito',
  otro: 'Otro',
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-48 shrink-0 text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export default async function PaginaDetalleTramite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tramite = await db.query.tramites.findFirst({
    where: (tramites, { eq }) => eq(tramites.id, id),
    with: {
      empresa: true,
      tipoTramite: true,
      pagos: { with: { responsableCobro: true, validadoPor: true } },
      documentos: true,
    },
  })

  if (!tramite) notFound()

  const [vehiculosDelTramite, responsablesDisponibles] = await Promise.all([
    db
      .select({ id: vehiculos.id, patente: vehiculos.patente })
      .from(tramite_vehiculos)
      .innerJoin(vehiculos, eq(tramite_vehiculos.vehiculo_id, vehiculos.id))
      .where(eq(tramite_vehiculos.tramite_id, tramite.id)),
    db
      .select({ id: usuarios.id, nombre: usuarios.nombre })
      .from(usuarios)
      .where(eq(usuarios.activo, true)),
  ])

  const supabase = await crearClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()
  const usuarioActual = user
    ? await db.query.usuarios.findFirst({ where: (usuarios, { eq }) => eq(usuarios.supabase_auth_id, user.id) })
    : null

  // Los pagos de trámites de Bolivia requieren validación de un usuario a
  // cargo de Bolivia (pais_gestion = 'bolivia', o null = ambos países)
  const puedeValidarPagos =
    usuarioActual != null &&
    (usuarioActual.pais_gestion === 'bolivia' || usuarioActual.pais_gestion === null)

  const pagosOrdenados = [...tramite.pagos].sort((a, b) => (a.fecha_pago < b.fecha_pago ? 1 : -1))
  const documentosOrdenados = [...tramite.documentos].sort((a, b) => (a.fecha_emision < b.fecha_emision ? 1 : -1))

  const [urlsComprobantes, urlsDocumentos] = await Promise.all([
    Promise.all(
      pagosOrdenados.map((p) => (p.comprobante_url ? obtenerUrlFirmada(supabase, p.comprobante_url) : null))
    ),
    Promise.all(documentosOrdenados.map((d) => obtenerUrlFirmada(supabase, d.archivo_url))),
  ])

  const saldo = calcularSaldoTramite(tramite.monto_total, tramite.moneda, tramite.pagos)
  const editable = tramite.estado !== 'concluido' && tramite.estado !== 'anulado'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
          <Link href="/tramites">
            <ArrowLeft className="size-4" />
            Volver a trámites
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1>Trámite N° {tramite.numero}</h1>
          <EstadoTramiteBadge estado={tramite.estado} />
          <PaisBadge pais={tramite.pais} />
        </div>
      </div>

      {/* Resumen de pago */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Monto total</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{tramite.monto_total} {tramite.moneda}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{saldo.totalPagado} {tramite.moneda}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p
              className={
                'mt-1 text-lg font-semibold tabular-nums ' +
                (Number(saldo.saldo) > 0 ? 'text-[#8a3626] dark:text-[#e0a99c]' : '')
              }
            >
              {saldo.saldo} {tramite.moneda}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Datos del trámite */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del trámite</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <Dato etiqueta="Empresa">{tramite.empresa.razon_social}</Dato>
            <Dato etiqueta="Tipo de trámite">{tramite.tipoTramite.nombre}</Dato>
            <Dato etiqueta="Fecha de solicitud">{tramite.fecha_solicitud}</Dato>
            {Object.entries(saldo.pagosOtrasMonedas).length > 0 && (
              <Dato etiqueta="Recibido en otra moneda">
                {Object.entries(saldo.pagosOtrasMonedas)
                  .map(([moneda, monto]) => `${monto} ${moneda}`)
                  .join(' · ')}
              </Dato>
            )}
            {tramite.referencia_doc_inicial && (
              <Dato etiqueta="Referencia doc. inicial">{tramite.referencia_doc_inicial}</Dato>
            )}
            {tramite.fecha_plazo && <Dato etiqueta="Plazo de respuesta">{tramite.fecha_plazo}</Dato>}
            {tramite.fecha_aprobacion && (
              <Dato etiqueta="Fecha de aprobación">{tramite.fecha_aprobacion}</Dato>
            )}
            {tramite.referencia_doc_respaldo && (
              <Dato etiqueta="Referencia doc. respaldo">{tramite.referencia_doc_respaldo}</Dato>
            )}
            {(tramite.fecha_vigencia_desde || tramite.fecha_vigencia_hasta) && (
              <Dato etiqueta="Vigencia">
                {tramite.fecha_vigencia_desde ?? '—'} a {tramite.fecha_vigencia_hasta ?? '—'}
              </Dato>
            )}
            <Dato etiqueta="Vehículos">
              {vehiculosDelTramite.length > 0
                ? vehiculosDelTramite.map((v) => v.patente).join(', ')
                : '—'}
            </Dato>
            {tramite.notas && <Dato etiqueta="Notas">{tramite.notas}</Dato>}
          </dl>

          {editable && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {tramite.estado === 'en_curso' && (
                <form action={cambiarEstadoTramite.bind(null, tramite.id, 'pendiente_observado')}>
                  <Button variant="secondary" size="sm" type="submit">Marcar pendiente/observado</Button>
                </form>
              )}
              {tramite.estado === 'pendiente_observado' && (
                <form action={cambiarEstadoTramite.bind(null, tramite.id, 'en_curso')}>
                  <Button variant="secondary" size="sm" type="submit">Volver a en curso</Button>
                </form>
              )}
              <form action={cambiarEstadoTramite.bind(null, tramite.id, 'concluido')}>
                <Button size="sm" type="submit">Marcar concluido</Button>
              </form>
              <form action={cambiarEstadoTramite.bind(null, tramite.id, 'anulado')}>
                <Button variant="secondary" size="sm" type="submit">Anular</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datos de seguimiento */}
      {editable && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de seguimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <FormularioSeguimiento
              accion={actualizarSeguimientoTramite.bind(null, tramite.id)}
              valoresIniciales={{
                referencia_doc_inicial: tramite.referencia_doc_inicial,
                fecha_plazo: tramite.fecha_plazo,
                referencia_doc_respaldo: tramite.referencia_doc_respaldo,
                fecha_aprobacion: tramite.fecha_aprobacion,
                fecha_vigencia_desde: tramite.fecha_vigencia_desde,
                fecha_vigencia_hasta: tramite.fecha_vigencia_hasta,
              }}
              tieneVigenciaAutomatica={tramite.tipoTramite.vigencia_meses != null}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pagosOrdenados.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Validado por</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagosOrdenados.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">{p.fecha_pago}</TableCell>
                      <TableCell className="tabular-nums">{p.monto} {p.moneda}</TableCell>
                      <TableCell>{etiquetaMetodoPago[p.metodo_pago]}</TableCell>
                      <TableCell>{p.responsableCobro.nombre}</TableCell>
                      <TableCell>
                        <EstadoPagoBadge estado={p.estado} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.validadoPor?.nombre ?? (p.pais_destino === 'bolivia' ? '—' : 'No aplica')}
                      </TableCell>
                      <TableCell>
                        {urlsComprobantes[i] ? (
                          <a
                            href={urlsComprobantes[i]!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {p.estado === 'pendiente' && puedeValidarPagos && (
                            <form action={validarPago.bind(null, p.id, tramite.id)}>
                              <Button size="sm" type="submit">Validar</Button>
                            </form>
                          )}
                          {p.estado !== 'anulado' && (
                            <form action={anularPago.bind(null, p.id, tramite.id)}>
                              <Button variant="secondary" size="sm" type="submit">Anular</Button>
                            </form>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          )}

          {tramite.estado !== 'anulado' && (
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">Registrar pago</p>
              <FormularioPago accion={registrarPago.bind(null, tramite.id)} usuarios={responsablesDisponibles} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos generados */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos generados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {documentosOrdenados.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Archivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentosOrdenados.map((d, i) => (
                    <TableRow key={d.id}>
                      <TableCell className="tabular-nums">{d.fecha_emision}</TableCell>
                      <TableCell>{d.tipo_documento}</TableCell>
                      <TableCell className="text-muted-foreground">{d.notas ?? '—'}</TableCell>
                      <TableCell>
                        {urlsDocumentos[i] ? (
                          <a
                            href={urlsDocumentos[i]!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin documentos generados.</p>
          )}

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium">Agregar documento</p>
            <FormularioDocumento accion={registrarDocumento.bind(null, tramite.id)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
