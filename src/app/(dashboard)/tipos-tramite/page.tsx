import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tipos_tramite } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cambiarActivoTipoTramite } from '@/actions/tipos-tramite'

export default async function PaginaTiposTramite() {
  const tipos = await db.select().from(tipos_tramite).orderBy(desc(tipos_tramite.created_at))

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Tipos de trámite</h1>
        <Button asChild>
          <Link href="/tipos-tramite/nueva">Nuevo tipo de trámite</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell>{t.nombre}</TableCell>
              <TableCell>{t.pais}</TableCell>
              <TableCell>{t.precio} {t.moneda}</TableCell>
              <TableCell>{t.vigencia_meses ? `${t.vigencia_meses} meses` : '—'}</TableCell>
              <TableCell>{t.activo ? 'Activo' : 'Inactivo'}</TableCell>
              <TableCell style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="secondary" asChild>
                  <Link href={`/tipos-tramite/${t.id}`}>Editar</Link>
                </Button>
                <form action={cambiarActivoTipoTramite.bind(null, t.id, !t.activo)}>
                  <Button variant="secondary" type="submit">{t.activo ? 'Desactivar' : 'Activar'}</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
          {tipos.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                Aún no hay tipos de trámite registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
