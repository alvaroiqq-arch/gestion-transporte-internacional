import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { empresas_cliente } from '@/lib/db/schema'
import { formatearRut } from '@/lib/validaciones/rut'
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
import { desactivarEmpresa } from '@/actions/empresas'

export default async function PaginaEmpresas() {
  const empresas = await db
    .select()
    .from(empresas_cliente)
    .orderBy(desc(empresas_cliente.created_at))

  return (
    <div>
      <PageHeader titulo="Empresas cliente" descripcion="Empresas de transporte que contratan el servicio">
        <Button asChild>
          <Link href="/empresas/nueva">Nueva empresa</Link>
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Razón social</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Identificador fiscal</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell className="font-medium">{empresa.razon_social}</TableCell>
                <TableCell>
                  <PaisBadge pais={empresa.pais_domicilio} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {empresa.pais_domicilio === 'chile'
                    ? formatearRut(empresa.identificador_fiscal)
                    : empresa.identificador_fiscal}
                </TableCell>
                <TableCell>{empresa.ciudad ?? '—'}</TableCell>
                <TableCell>
                  <ActivoBadge activo={empresa.activo} textoActivo="Activa" textoInactivo="Inactiva" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/empresas/${empresa.id}`}>Editar</Link>
                    </Button>
                    {empresa.activo && (
                      <form action={desactivarEmpresa.bind(null, empresa.id)}>
                        <Button variant="secondary" size="sm" type="submit">Desactivar</Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {empresas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aún no hay empresas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
