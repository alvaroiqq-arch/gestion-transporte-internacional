import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { remesas, usuarios } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { EstadoRemesaBadge } from '@/components/estados/estado-badges'

export default async function PaginaRemesas() {
  const filas = await db
    .select({
      id: remesas.id,
      numero: remesas.numero,
      moneda: remesas.moneda,
      estado: remesas.estado,
      fecha_envio: remesas.fecha_envio,
      fecha_recepcion: remesas.fecha_recepcion,
      enviado_por_nombre: usuarios.nombre,
    })
    .from(remesas)
    .leftJoin(usuarios, eq(remesas.enviado_por_id, usuarios.id))
    .orderBy(desc(remesas.numero))

  return (
    <div>
      <PageHeader titulo="Remesas" descripcion="Envíos de fondos cobrados en Chile hacia Bolivia">
        <Button asChild>
          <Link href="/remesas/nueva">Nueva remesa</Link>
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>N°</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Enviado por</TableHead>
              <TableHead>Fecha de envío</TableHead>
              <TableHead>Fecha de recepción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium tabular-nums">{r.numero}</TableCell>
                <TableCell>{r.moneda}</TableCell>
                <TableCell>{r.enviado_por_nombre ?? '—'}</TableCell>
                <TableCell className="tabular-nums">{r.fecha_envio}</TableCell>
                <TableCell className="tabular-nums">
                  {r.fecha_recepcion ? r.fecha_recepcion.toISOString().slice(0, 10) : '—'}
                </TableCell>
                <TableCell>
                  <EstadoRemesaBadge estado={r.estado} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/remesas/${r.id}`}>Ver</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Aún no hay remesas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
