import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tramites, tramite_vehiculos, vehiculos, usuarios } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { cambiarEstadoTramite } from '@/actions/tramites'
import { registrarPago, anularPago, validarPago } from '@/actions/pagos'
import { registrarDocumento } from '@/actions/documentos'
import { calcularSaldoTramite } from '@/lib/calculos/saldo'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerUrlFirmada } from '@/lib/supabase/storage'
import { FormularioPago } from '@/components/pagos/formulario-pago'
import { FormularioDocumento } from '@/components/documentos/formulario-documento'

const etiquetaEstado: Record<string, string> = {
  en_curso: 'En curso',
  pendiente_observado: 'Pendiente / observado',
  concluido: 'Concluido',
  anulado: 'Anulado',
}

const etiquetaEstadoPago: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  anulado: 'Anulado',
}

const etiquetaMetodoPago: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  deposito: 'Depósito',
  otro: 'Otro',
}

export default async function PaginaDetalleTramite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tramite = await db.query.tramites.findFirst({
    where: eq(tramites.id, id),
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
    ? await db.query.usuarios.findFirst({ where: eq(usuarios.supabase_auth_id, user.id) })
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

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <h1>Trámite N° {tramite.numero}</h1>

      <dl style={{ display: 'grid', gridTemplateColumns: '200px 1fr', rowGap: 8 }}>
        <dt>Empresa</dt>
        <dd>{tramite.empresa.razon_social}</dd>

        <dt>Tipo de trámite</dt>
        <dd>{tramite.tipoTramite.nombre}</dd>

        <dt>País</dt>
        <dd>{tramite.pais}</dd>

        <dt>Estado</dt>
        <dd>{etiquetaEstado[tramite.estado]}</dd>

        <dt>Monto</dt>
        <dd>{tramite.monto_total} {tramite.moneda}</dd>

        <dt>Pagado</dt>
        <dd>{saldo.totalPagado} {tramite.moneda}</dd>

        <dt>Saldo</dt>
        <dd>{saldo.saldo} {tramite.moneda}</dd>

        {Object.entries(saldo.pagosOtrasMonedas).length > 0 && (
          <>
            <dt>Recibido en otra moneda</dt>
            <dd>
              {Object.entries(saldo.pagosOtrasMonedas)
                .map(([moneda, monto]) => `${monto} ${moneda}`)
                .join(' · ')}
            </dd>
          </>
        )}

        <dt>Fecha de solicitud</dt>
        <dd>{tramite.fecha_solicitud}</dd>

        <dt>Vehículos</dt>
        <dd>
          {vehiculosDelTramite.length > 0
            ? vehiculosDelTramite.map((v) => v.patente).join(', ')
            : '—'}
        </dd>

        {tramite.notas && (
          <>
            <dt>Notas</dt>
            <dd>{tramite.notas}</dd>
          </>
        )}
      </dl>

      {tramite.estado !== 'concluido' && tramite.estado !== 'anulado' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {tramite.estado === 'en_curso' && (
            <form action={cambiarEstadoTramite.bind(null, tramite.id, 'pendiente_observado')}>
              <Button variant="secondary" type="submit">Marcar pendiente/observado</Button>
            </form>
          )}
          {tramite.estado === 'pendiente_observado' && (
            <form action={cambiarEstadoTramite.bind(null, tramite.id, 'en_curso')}>
              <Button variant="secondary" type="submit">Volver a en curso</Button>
            </form>
          )}
          <form action={cambiarEstadoTramite.bind(null, tramite.id, 'concluido')}>
            <Button type="submit">Marcar concluido</Button>
          </form>
          <form action={cambiarEstadoTramite.bind(null, tramite.id, 'anulado')}>
            <Button variant="secondary" type="submit">Anular</Button>
          </form>
        </div>
      )}

      <hr style={{ margin: '32px 0' }} />

      <h2>Pagos</h2>

      {pagosOrdenados.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border, #ddd)' }}>
              <th style={{ padding: '4px 8px 4px 0' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Monto</th>
              <th style={{ padding: '4px 8px' }}>Método</th>
              <th style={{ padding: '4px 8px' }}>Responsable</th>
              <th style={{ padding: '4px 8px' }}>Estado</th>
              <th style={{ padding: '4px 8px' }}>Validado por</th>
              <th style={{ padding: '4px 8px' }}>Comprobante</th>
              <th style={{ padding: '4px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {pagosOrdenados.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                <td style={{ padding: '4px 8px 4px 0' }}>{p.fecha_pago}</td>
                <td style={{ padding: '4px 8px' }}>{p.monto} {p.moneda}</td>
                <td style={{ padding: '4px 8px' }}>{etiquetaMetodoPago[p.metodo_pago]}</td>
                <td style={{ padding: '4px 8px' }}>{p.responsableCobro.nombre}</td>
                <td style={{ padding: '4px 8px' }}>{etiquetaEstadoPago[p.estado]}</td>
                <td style={{ padding: '4px 8px' }}>{p.validadoPor?.nombre ?? (p.pais_destino === 'bolivia' ? '—' : 'No aplica')}</td>
                <td style={{ padding: '4px 8px' }}>
                  {urlsComprobantes[i] ? (
                    <a href={urlsComprobantes[i]!} target="_blank" rel="noopener noreferrer">Ver</a>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '4px 8px', display: 'flex', gap: 4 }}>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'var(--text-muted, #888)' }}>Sin pagos registrados.</p>
      )}

      {tramite.estado !== 'anulado' && (
        <FormularioPago accion={registrarPago.bind(null, tramite.id)} usuarios={responsablesDisponibles} />
      )}

      <hr style={{ margin: '32px 0' }} />

      <h2>Documentos generados</h2>

      {documentosOrdenados.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border, #ddd)' }}>
              <th style={{ padding: '4px 8px 4px 0' }}>Fecha</th>
              <th style={{ padding: '4px 8px' }}>Tipo</th>
              <th style={{ padding: '4px 8px' }}>Notas</th>
              <th style={{ padding: '4px 8px' }}>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {documentosOrdenados.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: '1px solid var(--border, #eee)' }}>
                <td style={{ padding: '4px 8px 4px 0' }}>{d.fecha_emision}</td>
                <td style={{ padding: '4px 8px' }}>{d.tipo_documento}</td>
                <td style={{ padding: '4px 8px' }}>{d.notas ?? '—'}</td>
                <td style={{ padding: '4px 8px' }}>
                  {urlsDocumentos[i] ? (
                    <a href={urlsDocumentos[i]!} target="_blank" rel="noopener noreferrer">Ver</a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'var(--text-muted, #888)' }}>Sin documentos generados.</p>
      )}

      <FormularioDocumento accion={registrarDocumento.bind(null, tramite.id)} />
    </div>
  )
}
