import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tipos_tramite } from '@/lib/db/schema'
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
import { ActivoBadge, PaisBadge } from '@/components/estados/estado-badges'
import { cambiarActivoTipoTramite } from '@/actions/tipos-tramite'

export default async function PaginaTiposTramite() {
  const tipos = await db.select().from(tipos_tramite).orderBy(desc(tipos_tramite.created_at))

  return (
    <div>
      <PageHeader titulo="Tipos de trámite" descripcion="Catálogo de trámites, tarifas y vigencia">
        <Button asChild>
          <Link href="/tipos-tramite/nueva">Nuevo tipo de trámite</Link>
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell>
                  <PaisBadge pais={t.pais} />
                </TableCell>
                <TableCell className="tabular-nums">{t.precio} {t.moneda}</TableCell>
                <TableCell>{t.vigencia_meses ? `${t.vigencia_meses} meses` : '—'}</TableCell>
                <TableCell>
                  <ActivoBadge activo={t.activo} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/tipos-tramite/${t.id}`}>Editar</Link>
                    </Button>
                    <form action={cambiarActivoTipoTramite.bind(null, t.id, !t.activo)}>
                      <Button variant="secondary" size="sm" type="submit">
                        {t.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tipos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aún no hay tipos de trámite registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
